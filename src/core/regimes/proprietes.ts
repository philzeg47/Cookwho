// Détection des PROPRIÉTÉS alimentaires d'une recette (régimes de classe
// d'aliment, story 4.3b). Module /core PUR (zéro I/O). Miroir de `detect`
// (allergènes) : dictionnaire maison + matcher par TOKENS partagé (`../texte`),
// jamais en sous-chaîne. Sens conservateur : un ingrédient non classé → marqué
// non reconnu (le mur le traite en « incertain » si un régime est déclaré).

import { contientTokens, tokeniser } from "../texte";

/** Propriétés d'un ingrédient pertinentes pour les régimes alimentaires. */
export type ProprieteAlimentaire =
  | "VIANDE"
  | "PORC"
  | "POISSON"
  | "FRUITS_DE_MER"
  | "PRODUIT_ANIMAL";

/** Ordre canonique (sortie déterministe). */
export const PROPRIETES_CODES = [
  "VIANDE",
  "PORC",
  "POISSON",
  "FRUITS_DE_MER",
  "PRODUIT_ANIMAL",
] as const satisfies readonly ProprieteAlimentaire[];

export const LIBELLES_PROPRIETES: Record<ProprieteAlimentaire, string> = {
  VIANDE: "viande",
  PORC: "porc",
  POISSON: "poisson",
  FRUITS_DE_MER: "fruits de mer",
  PRODUIT_ANIMAL: "produit animal",
};

/**
 * Régime (libellé minuscule) → propriétés INTERDITES. Les régimes-allergènes
 * (sans gluten/lactose) restent gérés par le mur via les allergènes (4.3).
 * Halal/Casher différés (restent « incertain »).
 * NB : un porcin porte PORC **et** VIANDE → « sans porc » exclut le porc,
 * « pescétarien/végétarien/vegan » l'excluent aussi via VIANDE.
 */
export const REGIMES_VERS_PROPRIETES: Record<string, ProprieteAlimentaire[]> = {
  "sans porc": ["PORC"],
  pescetarien: ["VIANDE"],
  pescétarien: ["VIANDE"],
  vegetarien: ["VIANDE", "POISSON", "FRUITS_DE_MER"],
  végétarien: ["VIANDE", "POISSON", "FRUITS_DE_MER"],
  vegan: ["VIANDE", "POISSON", "FRUITS_DE_MER", "PRODUIT_ANIMAL"],
};

export type EntreeProprietes = {
  ingredient: string;
  proprietes: ProprieteAlimentaire[];
};

const V = "VIANDE" as const;
const P = "PORC" as const;
const F = "POISSON" as const;
const M = "FRUITS_DE_MER" as const;
const A = "PRODUIT_ANIMAL" as const;

/** Dictionnaire maison (curaté, non exhaustif). Clés normalisées au match. */
export const DICTIONNAIRE_PROPRIETES: EntreeProprietes[] = [
  // — Viandes terrestres (générique + espèces) —
  { ingredient: "viande", proprietes: [V] },
  { ingredient: "boeuf", proprietes: [V] },
  { ingredient: "bœuf", proprietes: [V] },
  { ingredient: "steak", proprietes: [V] },
  { ingredient: "steak hache", proprietes: [V] },
  { ingredient: "veau", proprietes: [V] },
  { ingredient: "agneau", proprietes: [V] },
  { ingredient: "mouton", proprietes: [V] },
  { ingredient: "gigot", proprietes: [V] },
  { ingredient: "gibier", proprietes: [V] },
  { ingredient: "chevreuil", proprietes: [V] },
  { ingredient: "sanglier", proprietes: [V, P] },
  // — Volailles —
  { ingredient: "poulet", proprietes: [V] },
  { ingredient: "volaille", proprietes: [V] },
  { ingredient: "dinde", proprietes: [V] },
  { ingredient: "canard", proprietes: [V] },
  { ingredient: "pintade", proprietes: [V] },
  { ingredient: "oie", proprietes: [V] },
  { ingredient: "lapin", proprietes: [V] },
  { ingredient: "foie gras", proprietes: [V] },
  { ingredient: "bouillon de volaille", proprietes: [V] },
  // — Porc & charcuterie —
  { ingredient: "porc", proprietes: [P, V] },
  { ingredient: "jambon", proprietes: [P, V] },
  { ingredient: "lardons", proprietes: [P, V] },
  { ingredient: "lard", proprietes: [P, V] },
  { ingredient: "bacon", proprietes: [P, V] },
  { ingredient: "chorizo", proprietes: [P, V] },
  { ingredient: "saucisson", proprietes: [P, V] },
  { ingredient: "andouille", proprietes: [P, V] },
  { ingredient: "boudin", proprietes: [P, V] },
  { ingredient: "rillettes", proprietes: [P, V] },
  { ingredient: "saucisse", proprietes: [V] }, // générique (pas forcément porc)
  { ingredient: "merguez", proprietes: [V] },
  // — Poissons —
  { ingredient: "poisson", proprietes: [F] },
  { ingredient: "saumon", proprietes: [F] },
  { ingredient: "thon", proprietes: [F] },
  { ingredient: "cabillaud", proprietes: [F] },
  { ingredient: "colin", proprietes: [F] },
  { ingredient: "merlu", proprietes: [F] },
  { ingredient: "lieu", proprietes: [F] },
  { ingredient: "sardine", proprietes: [F] },
  { ingredient: "maquereau", proprietes: [F] },
  { ingredient: "truite", proprietes: [F] },
  { ingredient: "bar", proprietes: [F] },
  { ingredient: "dorade", proprietes: [F] },
  { ingredient: "sole", proprietes: [F] },
  { ingredient: "hareng", proprietes: [F] },
  { ingredient: "anchois", proprietes: [F] },
  { ingredient: "surimi", proprietes: [F] },
  // — Fruits de mer —
  { ingredient: "fruits de mer", proprietes: [M] },
  { ingredient: "crevette", proprietes: [M] },
  { ingredient: "gambas", proprietes: [M] },
  { ingredient: "moule", proprietes: [M] },
  { ingredient: "huitre", proprietes: [M] },
  { ingredient: "huître", proprietes: [M] },
  { ingredient: "calmar", proprietes: [M] },
  { ingredient: "encornet", proprietes: [M] },
  { ingredient: "poulpe", proprietes: [M] },
  { ingredient: "seiche", proprietes: [M] },
  { ingredient: "homard", proprietes: [M] },
  { ingredient: "langouste", proprietes: [M] },
  { ingredient: "langoustine", proprietes: [M] },
  { ingredient: "crabe", proprietes: [M] },
  { ingredient: "saint jacques", proprietes: [M] },
  { ingredient: "bulot", proprietes: [M] },
  { ingredient: "palourde", proprietes: [M] },
  // — Produits animaux (non-chair) —
  { ingredient: "lait", proprietes: [A] },
  { ingredient: "beurre", proprietes: [A] },
  { ingredient: "creme", proprietes: [A] },
  { ingredient: "crème", proprietes: [A] },
  { ingredient: "fromage", proprietes: [A] },
  { ingredient: "yaourt", proprietes: [A] },
  { ingredient: "parmesan", proprietes: [A] },
  { ingredient: "mozzarella", proprietes: [A] },
  { ingredient: "gruyere", proprietes: [A] },
  { ingredient: "emmental", proprietes: [A] },
  { ingredient: "comte", proprietes: [A] },
  { ingredient: "chevre", proprietes: [A] },
  { ingredient: "ricotta", proprietes: [A] },
  { ingredient: "mascarpone", proprietes: [A] },
  { ingredient: "oeuf", proprietes: [A] },
  { ingredient: "œuf", proprietes: [A] },
  { ingredient: "miel", proprietes: [A] },
  { ingredient: "lactose", proprietes: [A] },
  // Gélatine : origine animale carnée → rejetée par végétarien ET vegan.
  { ingredient: "gelatine", proprietes: [V, A] },
  { ingredient: "gélatine", proprietes: [V, A] },
];

export type ResultatProprietes = {
  proprietes: ProprieteAlimentaire[];
  ingredientsNonReconnus: string[];
};

/** Index précalculé (pur) : tokens normalisés + drapeau « laitier générique ». */
const INDEX: ReadonlyArray<{
  tokens: string[];
  proprietes: ProprieteAlimentaire[];
  laitierGenerique: boolean;
}> = DICTIONNAIRE_PROPRIETES.map((e) => ({
  tokens: tokeniser(e.ingredient),
  proprietes: e.proprietes,
  // « lait » / « crème » seuls : contribution laitière neutralisée par un lait végétal.
  laitierGenerique: ["lait", "creme"].includes(tokeniser(e.ingredient).join(" ")),
}));

/**
 * Laits/crèmes VÉGÉTAUX (décision 4.3b) : « lait de coco » n'est PAS un produit
 * animal. Quand une telle locution est présente sur une ligne, on neutralise la
 * contribution laitière GÉNÉRIQUE (« lait »/« crème ») de cette ligne — les
 * autres entrées (fromage, œuf, lardons…) s'appliquent normalement.
 */
const LAITS_VEGETAUX: ReadonlyArray<string[]> = [
  "lait de coco",
  "lait d amande",
  "lait de soja",
  "lait d avoine",
  "lait de riz",
  "lait de noisette",
  "creme de coco",
  "creme de soja",
].map((p) => tokeniser(p));

export function detecterProprietes(ingredients: string[]): ResultatProprietes {
  const trouvees = new Set<ProprieteAlimentaire>();
  const ingredientsNonReconnus: string[] = [];

  for (const ligne of ingredients) {
    const tokens = tokeniser(ligne);
    const estLaitVegetal = LAITS_VEGETAUX.some((p) => contientTokens(tokens, p));
    let reconnu = estLaitVegetal;

    for (const entree of INDEX) {
      if (!contientTokens(tokens, entree.tokens)) continue;
      reconnu = true;
      // Lait végétal : ne pas compter la propriété « produit animal » du lait
      // ou de la crème génériques pour cette ligne.
      if (estLaitVegetal && entree.laitierGenerique) continue;
      for (const p of entree.proprietes) trouvees.add(p);
    }

    if (!reconnu) ingredientsNonReconnus.push(ligne);
  }

  const proprietes = PROPRIETES_CODES.filter((c) => trouvees.has(c));
  return { proprietes, ingredientsNonReconnus };
}
