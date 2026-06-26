import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  SEUIL_TOLERANCE_DEFAUT,
  TOLERANCE_LABELS,
} from "~/lib/restrictions";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Borne haute du seuil = dernier index de libellé (source unique, évite un
// off-by-one entre le Zod et la table de libellés côté UI).
const SEUIL_TOLERANCE_MAX = TOLERANCE_LABELS.length - 1;

/**
 * Router participant — procédures PUBLIQUES scopées au token (le participant
 * n'a pas de compte : le token cryptographique EST l'authentification).
 * Frontière étanche (NFR5) : ce router ne lit JAMAIS de recette, ni un autre
 * participant. Il résout `token → Participant → Repas` et ne renvoie que les
 * données strictement nécessaires.
 */
export const participantRouter = createTRPCRouter({
  monAcces: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // `findFirst` (et non `findUnique`) pour pouvoir filtrer sur la relation :
      // un repas expiré (ou purgé) devient indistinguable d'un token inconnu →
      // NOT_FOUND → LienInvalide, sans fuite sur l'existence du token (NFR5).
      const participant = await ctx.db.participant.findFirst({
        where: {
          accessToken: input.token,
          repas: { expiresAt: { gt: new Date() } },
        },
        select: {
          prenom: true,
          statut: true,
          repas: { select: { lieu: true, date: true, heure: true } },
          // Ses PROPRES restrictions (pour réafficher/modifier — story 3.4).
          // Frontière étanche (NFR5) : aucune recette, aucun autre participant.
          restrictions: {
            select: { type: true, valeur: true, seuilTolerance: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!participant) throw new TRPCError({ code: "NOT_FOUND" });
      return participant;
    }),

  /**
   * Enregistre les restrictions du participant et fait passer son statut à
   * REPONDU. Token = seule autorisation (publicProcedure). Atomique via
   * `$transaction` : on remplace l'ensemble des restrictions (delete + create)
   * puis on met à jour le statut — pas d'état intermédiaire incohérent.
   * Aucune restriction n'est obligatoire : un tableau vide est valide.
   */
  enregistrerRestrictions: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        restrictions: z
          .array(
            z
              .object({
                type: z.enum(["REGIME", "ALLERGIE", "NON_AIME"]),
                valeur: z.string().trim().min(1).max(200),
                seuilTolerance: z
                  .number()
                  .int()
                  .min(0)
                  .max(SEUIL_TOLERANCE_MAX)
                  .optional(),
              })
              .refine(
                (r) => r.type === "NON_AIME" || r.seuilTolerance === undefined,
                {
                  message: "seuilTolerance réservé aux aliments non-aimés",
                  path: ["seuilTolerance"],
                },
              ),
          )
          // Garde-fou anti-abus : la mutation est publique (token = seule auth).
          .max(50, "Trop de restrictions."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Frontière de sécurité : on résout le token côté serveur ; aucun id de
      // participant n'est jamais accepté du client. `findFirst` + filtre
      // `expiresAt` → impossible d'écrire sur un repas expiré/purgé (NFR6).
      const participant = await ctx.db.participant.findFirst({
        where: {
          accessToken: input.token,
          repas: { expiresAt: { gt: new Date() } },
        },
        select: { id: true },
      });
      if (!participant) throw new TRPCError({ code: "NOT_FOUND" });
      const participantId = participant.id;

      await ctx.db.$transaction(async (tx) => {
        await tx.restriction.deleteMany({ where: { participantId } });
        if (input.restrictions.length > 0) {
          await tx.restriction.createMany({
            data: input.restrictions.map((r) => ({
              participantId,
              type: r.type,
              valeur: r.valeur,
              // Seuil neutre par défaut (« Équilibré ») pour un non-aimé sans
              // seuil ; toujours null pour régime/allergie. Source unique du
              // défaut partagée avec le client (curseur de tolérance).
              seuilTolerance:
                r.type === "NON_AIME"
                  ? (r.seuilTolerance ?? SEUIL_TOLERANCE_DEFAUT)
                  : null,
            })),
          });
        }
        await tx.participant.update({
          where: { id: participantId },
          data: { statut: "REPONDU" },
        });
      });

      return { ok: true };
    }),
});
