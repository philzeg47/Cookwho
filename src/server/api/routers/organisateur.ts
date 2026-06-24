import { z } from "zod";

import { computeExpiresAt } from "~/lib/repas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
});
