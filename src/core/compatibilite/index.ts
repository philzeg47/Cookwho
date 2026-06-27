// Barrel du sous-domaine compatibilité (/core PUR).
// 4.3 : mur (filtre dur). 4.4+ : curseur, resoudre.
export type {
  Contraintes,
  RaisonExclusion,
  VerdictMur,
} from "./mur";
export { construireContraintes, mur } from "./mur";
