import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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
      const participant = await ctx.db.participant.findUnique({
        where: { accessToken: input.token },
        select: {
          prenom: true,
          repas: { select: { lieu: true, date: true, heure: true } },
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
                seuilTolerance: z.number().int().min(0).max(5).optional(),
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
      // participant n'est jamais accepté du client.
      const participant = await ctx.db.participant.findUnique({
        where: { accessToken: input.token },
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
              // Seuil neutre par défaut (3/5) pour un non-aimé sans seuil ;
              // toujours null pour régime/allergie.
              seuilTolerance:
                r.type === "NON_AIME" ? (r.seuilTolerance ?? 3) : null,
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
