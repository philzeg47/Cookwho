// Noyau de domaine PUR de CookWho (zéro I/O).
// allergenes/ : taxonomie + dictionnaire (4.0). normalize/detect arrivent en 4.1.
// compatibilite/ : mur/curseur/resoudre arriveront plus loin dans l'Epic 4.
export const CORE_PLACEHOLDER = "cookwho-core" as const;

export type { AllergeneUE, EntreeDictionnaire } from "./allergenes";
export {
  ALLERGENES_UE_CODES,
  LIBELLES_ALLERGENES,
  DICTIONNAIRE_ALLERGENES,
} from "./allergenes";
