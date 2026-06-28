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

export type {
  Contraintes,
  RaisonExclusion,
  VerdictMur,
  NonAime,
  ContrainteBloquante,
  ModeResolution,
  OptionsResolution,
  RecetteEntree,
  RecetteRetenue,
  ResultatResolution,
} from "./compatibilite";
export {
  construireContraintes,
  mur,
  curseur,
  genants,
  SEUIL_TOLERANCE_MAX,
  resoudre,
} from "./compatibilite";
export { tokeniser, contientTokens } from "./texte";
