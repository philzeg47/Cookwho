// Barrel du sous-domaine compatibilité (/core PUR).
// 4.3 : mur (filtre dur). 4.4a : curseur + resoudre (chemin nominal).
export type {
  Contraintes,
  RaisonExclusion,
  VerdictMur,
} from "./mur";
export { construireContraintes, mur } from "./mur";
export type { NonAime } from "./curseur";
export { curseur, genants, SEUIL_TOLERANCE_MAX } from "./curseur";
export type {
  ContrainteBloquante,
  ModeResolution,
  OptionsResolution,
  RecetteEntree,
  RecetteRetenue,
  ResultatResolution,
} from "./resoudre";
export { resoudre } from "./resoudre";
