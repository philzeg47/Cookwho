// Noyau de domaine PUR de CookWho (zéro I/O).
// allergenes/ : taxonomie + dictionnaire + normalize + detect (4.0/4.1).
// compatibilite/ : mur (4.3). curseur/resoudre arrivent en 4.4+.
export const CORE_PLACEHOLDER = "cookwho-core" as const;

export type {
  AllergeneUE,
  EntreeDictionnaire,
  ResultatDetection,
} from "./allergenes";
export {
  ALLERGENES_UE_CODES,
  LIBELLES_ALLERGENES,
  DICTIONNAIRE_ALLERGENES,
  normalize,
  detect,
} from "./allergenes";

export type { Contraintes, RaisonExclusion, VerdictMur } from "./compatibilite";
export { construireContraintes, mur } from "./compatibilite";
