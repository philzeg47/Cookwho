// Taxonomie canonique des 14 allergènes réglementaires UE (Règlement UE
// 1169/2011, Annexe II). Source de vérité du moteur de détection (/core, PUR).
// Les libellés FR sont alignés sur la liste déclarable côté participant
// (`ALLERGENES_UE` dans `~/lib/restrictions`) — un test garantit l'absence de
// dérive.

export type AllergeneUE =
  | "GLUTEN"
  | "CRUSTACES"
  | "OEUFS"
  | "POISSON"
  | "ARACHIDES"
  | "SOJA"
  | "LAIT"
  | "FRUITS_A_COQUE"
  | "CELERI"
  | "MOUTARDE"
  | "SESAME"
  | "SULFITES"
  | "LUPIN"
  | "MOLLUSQUES";

/** Les 14 codes canoniques, dans l'ordre de l'Annexe II. */
export const ALLERGENES_UE_CODES: readonly AllergeneUE[] = [
  "GLUTEN",
  "CRUSTACES",
  "OEUFS",
  "POISSON",
  "ARACHIDES",
  "SOJA",
  "LAIT",
  "FRUITS_A_COQUE",
  "CELERI",
  "MOUTARDE",
  "SESAME",
  "SULFITES",
  "LUPIN",
  "MOLLUSQUES",
] as const;

/** Libellé FR de chaque allergène — identiques à la liste participant. */
export const LIBELLES_ALLERGENES: Record<AllergeneUE, string> = {
  GLUTEN: "Gluten",
  CRUSTACES: "Crustacés",
  OEUFS: "Œufs",
  POISSON: "Poisson",
  ARACHIDES: "Arachides",
  SOJA: "Soja",
  LAIT: "Lait",
  FRUITS_A_COQUE: "Fruits à coque",
  CELERI: "Céleri",
  MOUTARDE: "Moutarde",
  SESAME: "Sésame",
  SULFITES: "Sulfites",
  LUPIN: "Lupin",
  MOLLUSQUES: "Mollusques",
};
