import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";
import { echapperHtml } from "~/lib/html";
import { computeExpiresAt } from "~/lib/repas";
import { genererAccessToken } from "~/lib/tokens";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { envoyerEmail } from "~/server/email";

/** Plafond de participants par repas (garde-fou anti-abus — V1). */
const MAX_PARTICIPANTS_PAR_REPAS = 50;

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
      return ctx.db.repas.create({
        data: {
          lieu: input.lieu,
          date: input.date,
          heure: input.heure,
          expiresAt: computeExpiresAt(input.date),
          organisateurId: ctx.session.user.id,
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
        include: { participants: { orderBy: { createdAt: "asc" } } },
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
});
