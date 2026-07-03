import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";
import { echapperHtml } from "~/lib/html";
import { computeExpiresAt } from "~/lib/repas";
import { SEUIL_TOLERANCE_DEFAUT, TOLERANCE_LABELS } from "~/lib/restrictions";
import { genererAccessToken } from "~/lib/tokens";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { envoyerEmail } from "~/server/email";
import { type DbGeneration, genererPourRepas } from "~/server/generation";
import { recettesLocales } from "~/server/sources/recettesLocales";

/** Plafond de participants par repas (garde-fou anti-abus — V1). */
const MAX_PARTICIPANTS_PAR_REPAS = 50;

// Borne du seuil = dernier index de libellé (source unique, cf. participant).
const SEUIL_TOLERANCE_MAX = TOLERANCE_LABELS.length - 1;

/** Schéma d'une liste de restrictions (partagé avec le flux participant). */
const restrictionsInput = z
  .array(
    z
      .object({
        type: z.enum(["REGIME", "ALLERGIE", "NON_AIME"]),
        valeur: z.string().trim().min(1).max(200),
        seuilTolerance: z.number().int().min(0).max(SEUIL_TOLERANCE_MAX).optional(),
      })
      .refine((r) => r.type === "NON_AIME" || r.seuilTolerance === undefined, {
        message: "seuilTolerance réservé aux aliments non-aimés",
        path: ["seuilTolerance"],
      }),
  )
  .max(50, "Trop de restrictions.");

/**
 * Router organisateur — procédures PROTÉGÉES (session requise).
 * Frontière de sécurité : `organisateurId` provient TOUJOURS de la session,
 * jamais d'un id fourni par le client. Aucune procédure de recette ici.
 */
export const organisateurRouter = createTRPCRouter({
  creerRepas: protectedProcedure
    .input(
      z.object({
        lieu: z.string().trim().min(1, "Le lieu est requis").max(200),
        date: z.coerce.date().refine(
          (d) => {
            const aujourdhui = new Date();
            aujourdhui.setHours(0, 0, 0, 0);
            return d.getTime() >= aujourdhui.getTime();
          },
          { message: "La date du repas doit être aujourd'hui ou plus tard." },
        ),
        heure: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure attendue au format HH:mm"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Profil de restrictions de l'organisateur (les mêmes pour TOUS ses repas)
      // → on pré-remplit sa nouvelle entrée avec ce qu'il a déjà déclaré.
      const profilOrga = await ctx.db.participant.findFirst({
        where: {
          estOrganisateur: true,
          repas: { organisateurId: ctx.session.user.id },
          restrictions: { some: {} },
        },
        orderBy: { createdAt: "desc" },
        select: {
          restrictions: {
            select: { type: true, valeur: true, seuilTolerance: true },
          },
        },
      });
      const profil = profilOrga?.restrictions ?? [];

      // L'organisateur est aussi un convive : on crée son entrée « participant »
      // (estOrganisateur) en même temps, pour qu'il apparaisse dans la liste et
      // que ses restrictions comptent dans la génération.
      return ctx.db.repas.create({
        data: {
          lieu: input.lieu,
          date: input.date,
          heure: input.heure,
          expiresAt: computeExpiresAt(input.date),
          organisateurId: ctx.session.user.id,
          participants: {
            create: {
              prenom: ctx.session.user.name ?? "Moi",
              estOrganisateur: true,
              accessToken: genererAccessToken(),
              statut: profil.length > 0 ? "REPONDU" : "EN_ATTENTE",
              ...(profil.length > 0
                ? { restrictions: { create: profil } }
                : {}),
            },
          },
        },
      });
    }),

  mesRepas: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.repas.findMany({
      where: { organisateurId: ctx.session.user.id },
      orderBy: { date: "asc" },
    });
  }),

  repasDetail: protectedProcedure
    .input(z.object({ repasId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repas = await ctx.db.repas.findFirst({
        where: { id: input.repasId, organisateurId: ctx.session.user.id },
        include: {
          participants: {
            orderBy: { createdAt: "asc" },
            // L'organisateur (propriétaire) voit les restrictions de ses convives
            // — base de l'avertissement allergie (FR16). Réservé organisateur (NFR5).
            include: { restrictions: { orderBy: { type: "asc" } } },
          },
        },
      });
      if (!repas) throw new TRPCError({ code: "NOT_FOUND" });
      return repas;
    }),

  ajouterParticipant: protectedProcedure
    .input(
      z.object({
        repasId: z.string(),
        prenom: z.string().trim().min(1, "Le prénom est requis").max(100),
        email: z
          .string()
          .trim()
          .email("Email invalide")
          .optional()
          .or(z.literal(""))
          .transform((v) => (v ? v : undefined)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Frontière de sécurité : le repas doit appartenir à l'organisateur connecté.
      const repas = await ctx.db.repas.findFirst({
        where: { id: input.repasId, organisateurId: ctx.session.user.id },
        select: { id: true },
      });
      if (!repas) throw new TRPCError({ code: "NOT_FOUND" });

      const nbParticipants = await ctx.db.participant.count({
        where: { repasId: repas.id },
      });
      if (nbParticipants >= MAX_PARTICIPANTS_PAR_REPAS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Nombre maximum de participants atteint (${MAX_PARTICIPANTS_PAR_REPAS}).`,
        });
      }

      return ctx.db.participant.create({
        data: {
          repasId: repas.id,
          prenom: input.prenom,
          email: input.email,
          accessToken: genererAccessToken(),
        },
      });
    }),

  /**
   * Retire un participant d'un repas possédé. Ownership via la relation
   * (`repas.organisateurId`) ; ses restrictions sont supprimées en cascade
   * (schéma `onDelete: Cascade`). Réservé organisateur (NFR5).
   */
  retirerParticipant: protectedProcedure
    .input(z.object({ participantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.db.participant.deleteMany({
        where: {
          id: input.participantId,
          repas: { organisateurId: ctx.session.user.id },
        },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),

  /**
   * Enregistre les restrictions de l'ORGANISATEUR pour un repas possédé (il est
   * un convive comme les autres — ses contraintes comptent dans la génération).
   * Trouve (ou crée pour un repas ancien) son entrée `estOrganisateur`, remplace
   * ses restrictions et passe son statut à REPONDU. Réservé organisateur (NFR5).
   */
  enregistrerMesRestrictions: protectedProcedure
    .input(z.object({ repasId: z.string(), restrictions: restrictionsInput }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const prenom = ctx.session.user.name ?? "Moi";

      // Ownership (contexte de la requête).
      const repas = await ctx.db.repas.findFirst({
        where: { id: input.repasId, organisateurId: userId },
        select: { id: true },
      });
      if (!repas) throw new TRPCError({ code: "NOT_FOUND" });

      // Les restrictions de l'organisateur sont les MÊMES pour tous ses repas :
      // on synchronise son entrée (créée si absente) sur chacun d'eux.
      const repasList = await ctx.db.repas.findMany({
        where: { organisateurId: userId },
        select: { id: true },
      });

      const lignes = (participantId: string) =>
        input.restrictions.map((r) => ({
          participantId,
          type: r.type,
          valeur: r.valeur,
          seuilTolerance:
            r.type === "NON_AIME"
              ? (r.seuilTolerance ?? SEUIL_TOLERANCE_DEFAUT)
              : null,
        }));

      await ctx.db.$transaction(async (tx) => {
        for (const { id: rid } of repasList) {
          const existant = await tx.participant.findFirst({
            where: { repasId: rid, estOrganisateur: true },
            select: { id: true },
          });
          const pid =
            existant?.id ??
            (
              await tx.participant.create({
                data: {
                  repasId: rid,
                  prenom,
                  estOrganisateur: true,
                  accessToken: genererAccessToken(),
                },
                select: { id: true },
              })
            ).id;

          await tx.restriction.deleteMany({ where: { participantId: pid } });
          if (input.restrictions.length > 0) {
            await tx.restriction.createMany({ data: lignes(pid) });
          }
          await tx.participant.update({
            where: { id: pid },
            data: { statut: "REPONDU" },
          });
        }
      });

      return { ok: true as const };
    }),

  envoyerInvitation: protectedProcedure
    .input(z.object({ participantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Frontière de sécurité via la relation : le participant doit appartenir
      // à un repas possédé par l'organisateur connecté.
      const participant = await ctx.db.participant.findFirst({
        where: {
          id: input.participantId,
          repas: { organisateurId: ctx.session.user.id },
        },
        include: { repas: true },
      });
      if (!participant) throw new TRPCError({ code: "NOT_FOUND" });
      if (!participant.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ce participant n'a pas d'email.",
        });
      }

      const url = `${env.APP_URL}/p/${participant.accessToken}`;
      const prenom = echapperHtml(participant.prenom);
      await envoyerEmail({
        to: participant.email,
        subject: `CookWho — invitation au repas « ${participant.repas.lieu} »`,
        html: `<p>Bonjour ${prenom},</p>
<p>Tu es convié·e à un repas. Pour qu'on choisisse un plat qui te convient, indique tes préférences et contraintes alimentaires ici :</p>
<p><a href="${url}">${url}</a></p>
<p>Ça prend moins de deux minutes. À très vite — CookWho</p>`,
      });

      return { ok: true };
    }),

  /**
   * Génère 3-10 recettes compatibles (mur + curseur) pour un repas possédé.
   * Vue réservée à l'organisateur (NFR5). La logique vit dans `generation.ts`
   * + `/core` ; ce router ne fait que la frontière de sécurité + délégation.
   */
  genererRecettes: protectedProcedure
    .input(
      z.object({
        repasId: z.string(),
        exclure: z.array(z.string()).max(200).optional(),
        forcer: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Cast de frontière : le client Prisma fournit ces méthodes à l'exécution ;
      // TS ne peut pas prouver l'assignabilité structurelle (méthodes génériques).
      return genererPourRepas(ctx.db as unknown as DbGeneration, recettesLocales, {
        repasId: input.repasId,
        organisateurId: ctx.session.user.id,
        exclure: input.exclure,
        forcer: input.forcer,
      });
    }),

  /**
   * Retient un plat pour un repas possédé (story 5.1). Réservé organisateur
   * (NFR5) ; l'avertissement allergie + validation (5.3) s'insérera EN AMONT.
   */
  retenirPlat: protectedProcedure
    .input(
      z.object({
        repasId: z.string(),
        ref: z.string().min(1).max(500),
        titre: z.string().trim().min(1).max(300),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ownership : n'écrit que si le repas appartient à la session.
      const res = await ctx.db.repas.updateMany({
        where: { id: input.repasId, organisateurId: ctx.session.user.id },
        data: { platRetenuRef: input.ref, platRetenuTitre: input.titre },
      });
      if (res.count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true as const };
    }),
});
