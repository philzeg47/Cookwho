// Abstraction de source de recettes (FR14). Le moteur ne connaît QUE cette
// interface — jamais l'implémentation concrète (source jetable). Les
// ingrédients sont du TEXTE LIBRE non normalisé ; la normalisation/détection
// /core s'applique plus tard (story 4.4).

export type RecetteBrute = {
  source: string; // ex. "marmiton"
  sourceRef: string; // identifiant stable côté source (URL/slug)
  titre: string;
  ingredientsTexte: string[]; // lignes d'ingrédients en texte libre
};

export type CriteresRecherche = {
  requete?: string;
  limite?: number;
};

export interface SourceDeRecettes {
  readonly nom: string;
  chercher(criteres: CriteresRecherche): Promise<RecetteBrute[]>;
}
