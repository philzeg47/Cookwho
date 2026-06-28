import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

import { env } from "~/env";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Configuration NextAuth.js (Auth.js v5) pour CookWho.
 *
 * Connexion organisateur par LIEN MAGIQUE (sans mot de passe) via le provider
 * Resend. Le modèle Auth.js `User` représente l'organisateur en V1.
 * Le magic link s'appuie sur l'adapter Prisma (table `VerificationToken`) ;
 * la stratégie de session reste donc `database` (défaut avec adapter — ne pas
 * la forcer en `jwt`).
 *
 * @see https://authjs.dev/getting-started/authentication/email
 */
export const authConfig = {
  providers: [
    Resend({
      apiKey: env.AUTH_RESEND_KEY,
      from: env.EMAIL_FROM,
      /**
       * Fallback de développement : on logge le lien magique dans la console
       * serveur au lieu d'appeler Resend, pour pouvoir tester sans clé API ni
       * envoi réel. STRICTEMENT borné au hors-production (NFR6 : pas de donnée
       * sensible en log en prod).
       */
      ...(env.NODE_ENV === "development" && {
        sendVerificationRequest({
          identifier,
          url,
        }: {
          identifier: string;
          url: string;
        }) {
          console.log(`\n🔗 Lien magique pour ${identifier} :\n${url}\n`);
        },
      }),
    }),
  ],
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/connexion",
    verifyRequest: "/connexion/verifier",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
