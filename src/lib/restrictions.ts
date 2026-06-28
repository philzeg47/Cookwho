/**
 * Données de référence de l'assistant de restrictions (story 3.2b).
 * Côté participant uniquement — aucune donnée de recette ici (NFR5).
 */

/** Régimes courants proposés en sélection rapide (multi-select, cumul possible). */
export const REGIMES_COURANTS = [
  "Végétarien",
  "Vegan",
  "Pescétarien",
  "Sans gluten",
  "Sans lactose",
  "Sans porc",
  "Halal",
  "Casher",
] as const;

/**
 * Les 14 allergènes réglementaires UE (déclarables par le participant).
 * Le nombre 14 est garanti par un test (gate de conformité).
 */
export const ALLERGENES_UE = [
  "Gluten",
  "Crustacés",
  "Œufs",
  "Poisson",
  "Arachides",
  "Soja",
  "Lait",
  "Fruits à coque",
  "Céleri",
  "Moutarde",
  "Sésame",
  "Sulfites",
  "Lupin",
  "Mollusques",
] as const;

/**
 * Étiquettes du curseur de tolérance (global aux aliments non-aimés).
 * EXPERIENCE.md : « valeur lisible en clair, pas de chiffre ». L'index (0-4)
 * est la valeur stockée ; il reste dans la borne serveur `seuilTolerance` 0-5.
 */
export const TOLERANCE_LABELS = [
  "Strict",
  "Plutôt strict",
  "Équilibré",
  "Plutôt souple",
  "Souple",
] as const;

/** Seuil neutre par défaut : « Équilibré » (index 2). */
export const SEUIL_TOLERANCE_DEFAUT = 2;
