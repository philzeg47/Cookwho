// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast";

/**
 * Gate d'accessibilité : chaque paire texte/fond réellement utilisée dans
 * l'UI Cocon doit respecter WCAG AA (≥ 4.5:1 pour le texte normal).
 * `globals.css` est la source de vérité — un token qui casse le contraste
 * fait échouer la CI.
 */
const css = readFileSync(
  fileURLToPath(new URL("../styles/globals.css", import.meta.url)),
  "utf8",
);

const tokens: Record<string, string> = {};
for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
  tokens[m[1]!] = m[2]!;
}

const AA_NORMAL = 4.5;

// [libellé, tokenTexte, tokenFond] — paires effectivement rendues par les composants/pages.
const paires: Array<[string, string, string]> = [
  ["corps de page", "ink", "background"],
  ["texte secondaire", "ink-soft", "background"],
  ["bouton primaire", "on-primary", "primary"],
  ["lien/texte fort", "primary-strong", "background"],
  ["Banner info", "primary-strong", "primary-soft"],
  ["Banner danger / Chip allergie", "danger-strong", "danger-soft"],
  ["SafeBadge", "safe-text", "safe"],
  ["Chip régime", "safe-text", "safe-soft"],
  ["Chip non-aimé", "accent-strong", "accent-soft"],
  ["bouton secondaire (survol)", "ink", "surface-muted"],
];

describe("Contraste WCAG AA de la palette Cocon", () => {
  it.each(paires)("%s respecte AA (≥ 4.5:1)", (_label, texte, fond) => {
    const cText = tokens[texte];
    const cBg = tokens[fond];
    expect(cText, `token --color-${texte} absent`).toBeDefined();
    expect(cBg, `token --color-${fond} absent`).toBeDefined();
    const ratio = contrastRatio(cText!, cBg!);
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("bouton primaire au survol (blanc sur primary-strong) respecte AA", () => {
    // `text-white` est l'utilitaire Tailwind natif (#ffffff), pas un token Cocon.
    expect(
      contrastRatio("#ffffff", tokens["primary-strong"]!),
    ).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
