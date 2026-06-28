import { organisateurRouter } from "~/server/api/routers/organisateur";
import { participantRouter } from "~/server/api/routers/participant";
import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 * Frontière étanche : `organisateur` (protégé) et `participant` (scopé au token,
 * sans accès aux recettes) sont deux routers distincts.
 */
export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true })),
  organisateur: organisateurRouter,
  participant: participantRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 */
export const createCaller = createCallerFactory(appRouter);
