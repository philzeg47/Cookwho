// Implémentation `SourceDeRecettes` adossée au scraper non-officiel
// `marmiton-api` (v3). TOUTE la surface du package est isolée ici : le reste
// de l'app ne dépend que de l'interface `SourceDeRecettes` (source jetable).
//
// ⚠️ Scraper non-officiel, côté serveur uniquement, licence zone grise
// (gate pré-public, hors V1 testeurs). `searchRecipes(qs)` renvoie des recettes
// COMPLÈTES (avec `ingredients`) en un seul appel.

import { MarmitonQueryBuilder, searchRecipes } from "marmiton-api";

import type { RecetteBrute, SourceDeRecettes } from "./SourceDeRecettes";

export const marmitonSource: SourceDeRecettes = {
  nom: "marmiton",

  async chercher({ requete, limite }) {
    const qs = new MarmitonQueryBuilder()
      .withTitleContaining(requete ?? "")
      .build();
    const recettes = await searchRecipes(qs);

    // Scraper non-officiel : écarter les entrées sans identifiant/titre stable
    // (un `url` vide ferait collisionner les lignes de cache).
    const valides = recettes.filter((r) => r.url && r.name);
    const limitees =
      typeof limite === "number" ? valides.slice(0, limite) : valides;

    return limitees.map(
      (r): RecetteBrute => ({
        source: "marmiton",
        sourceRef: r.url,
        titre: r.name,
        ingredientsTexte: r.ingredients ?? [],
      }),
    );
  },
};
