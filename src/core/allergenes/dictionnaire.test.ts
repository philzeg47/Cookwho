import { describe, expect, it } from "vitest";

import { ALLERGENES_UE } from "~/lib/restrictions";

import {
  ALLERGENES_UE_CODES,
  LIBELLES_ALLERGENES,
} from "./allergenes-ue";
import { DICTIONNAIRE_ALLERGENES } from "./dictionnaire";

/** Forme normalisée attendue d'une clé : minuscules, sans diacritiques. */
function normaliser(valeur: string) {
  return valeur
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

describe("taxonomie des 14 allergènes UE", () => {
  it("compte exactement 14 codes, sans doublon", () => {
    expect(ALLERGENES_UE_CODES).toHaveLength(14);
    expect(new Set(ALLERGENES_UE_CODES).size).toBe(14);
  });

  it("a un libellé non vide pour chaque code", () => {
    for (const code of ALLERGENES_UE_CODES) {
      expect(LIBELLES_ALLERGENES[code].trim().length).toBeGreaterThan(0);
    }
  });

  it("aligne ses libellés sur la liste déclarable côté participant (anti-dérive)", () => {
    const libellesCore = new Set(
      ALLERGENES_UE_CODES.map((c) => LIBELLES_ALLERGENES[c]),
    );
    const libellesParticipant = new Set<string>(ALLERGENES_UE);
    expect(libellesCore).toEqual(libellesParticipant);
  });
});

describe("dictionnaire ingrédient → allergène", () => {
  it("couvre chacun des 14 allergènes UE par au moins une entrée", () => {
    const couverts = new Set(
      DICTIONNAIRE_ALLERGENES.flatMap((e) => e.allergenes),
    );
    for (const code of ALLERGENES_UE_CODES) {
      expect(couverts.has(code)).toBe(true);
    }
  });

  it("a, pour chaque entrée, ≥1 allergène, une provenance et un ingrédient non vides", () => {
    for (const entree of DICTIONNAIRE_ALLERGENES) {
      expect(entree.allergenes.length).toBeGreaterThanOrEqual(1);
      expect(entree.provenance.trim().length).toBeGreaterThan(0);
      expect(entree.ingredient.trim().length).toBeGreaterThan(0);
    }
  });

  it("ne référence que des codes d'allergènes connus", () => {
    const codes = new Set<string>(ALLERGENES_UE_CODES);
    for (const entree of DICTIONNAIRE_ALLERGENES) {
      for (const a of entree.allergenes) {
        expect(codes.has(a)).toBe(true);
      }
    }
  });

  it("n'a pas de clé ingrédient en double", () => {
    const cles = DICTIONNAIRE_ALLERGENES.map((e) => e.ingredient);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("stocke toutes les clés sous forme normalisée (minuscules, sans accents)", () => {
    for (const entree of DICTIONNAIRE_ALLERGENES) {
      expect(entree.ingredient).toBe(normaliser(entree.ingredient));
    }
  });
});
