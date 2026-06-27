// Barrel du sous-domaine allergènes (/core PUR).
// 4.0 : taxonomie + dictionnaire. 4.1a : normalize. 4.1b ajoutera detect.
export type { AllergeneUE } from "./allergenes-ue";
export {
  ALLERGENES_UE_CODES,
  LIBELLES_ALLERGENES,
} from "./allergenes-ue";
export type { EntreeDictionnaire } from "./dictionnaire";
export { DICTIONNAIRE_ALLERGENES } from "./dictionnaire";
export { normalize } from "./normalize";
