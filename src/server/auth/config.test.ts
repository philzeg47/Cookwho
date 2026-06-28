// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Assertion au niveau source : importer `./config` chargerait le runtime
 * next-auth, qui tire `next/server` (non résoluble hors runtime Next sous
 * Vitest). On garde donc un garde-fou anti-régression robuste en vérifiant
 * directement le câblage déclaré dans `config.ts`.
 */
const configSource = readFileSync(
  fileURLToPath(new URL("./config.ts", import.meta.url)),
  "utf8",
);

describe("authConfig (source)", () => {
  it("câble le provider lien magique Resend", () => {
    expect(configSource).toMatch(/from "next-auth\/providers\/resend"/);
    expect(configSource).toMatch(/Resend\(/);
  });

  it("n'utilise plus de provider Discord (pas de mot de passe / OAuth démo)", () => {
    expect(configSource).not.toMatch(/[Dd]iscord/);
  });

  it("conserve l'adapter Prisma (jetons de lien magique en base)", () => {
    expect(configSource).toMatch(/adapter:\s*PrismaAdapter\(db\)/);
  });

  it("redirige connexion et vérification vers les pages Cocon", () => {
    expect(configSource).toMatch(/signIn:\s*"\/connexion"/);
    expect(configSource).toMatch(/verifyRequest:\s*"\/connexion\/verifier"/);
  });

  it("borne le log du lien magique au développement (NFR6)", () => {
    expect(configSource).toMatch(/env\.NODE_ENV === "development"/);
  });

  it("ne force pas la stratégie de session en jwt (contrat du lien magique)", () => {
    expect(configSource).not.toMatch(/strategy:\s*["']jwt["']/);
  });
});
