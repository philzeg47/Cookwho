// Source de recettes LOCALE (story de correctif — bug bloquant génération).
// Le scraper `marmiton-api` v3 est cassé (site changé) → pool vide → PAS_ASSEZ.
// Cette source intégrée garantit une génération FIABLE et EN FRANÇAIS (requise
// par le moteur de détection FR : allergènes 4.1b, régimes 4.3b). Implémente
// l'interface `SourceDeRecettes` (jetable) — le moteur ne change pas.

import type { RecetteBrute, SourceDeRecettes } from "./SourceDeRecettes";

type RecetteLocale = { titre: string; ingredients: string[] };

/** ~50 plats principaux français, titre + lignes d'ingrédients (texte libre). */
const RECETTES: RecetteLocale[] = [
  // — Volailles —
  { titre: "Poulet basquaise", ingredients: ["blanc de poulet", "poivrons rouges", "tomates", "oignon", "ail", "huile d'olive", "riz"] },
  { titre: "Poulet rôti et pommes de terre", ingredients: ["poulet", "pommes de terre", "thym", "ail", "beurre", "sel"] },
  { titre: "Émincé de dinde à la crème", ingredients: ["escalope de dinde", "crème fraîche", "champignons", "oignon", "moutarde"] },
  { titre: "Curry de poulet au lait de coco", ingredients: ["blanc de poulet", "lait de coco", "curry", "oignon", "riz", "coriandre"] },
  { titre: "Cuisses de poulet au citron", ingredients: ["cuisses de poulet", "citron", "ail", "huile d'olive", "romarin", "pommes de terre"] },
  { titre: "Blanquette de veau", ingredients: ["veau", "carottes", "oignon", "crème fraîche", "champignons", "riz"] },

  // — Bœuf & agneau —
  { titre: "Bœuf bourguignon", ingredients: ["bœuf", "carottes", "oignon", "vin rouge", "lardons", "champignons"] },
  { titre: "Chili con carne", ingredients: ["bœuf haché", "haricots rouges", "tomates", "oignon", "poivron", "cumin", "riz"] },
  { titre: "Steak haché et frites", ingredients: ["steak haché", "pommes de terre", "huile", "sel"] },
  { titre: "Hachis parmentier", ingredients: ["bœuf haché", "pommes de terre", "lait", "beurre", "oignon", "muscade"] },
  { titre: "Gigot d'agneau aux haricots", ingredients: ["agneau", "haricots blancs", "ail", "thym", "huile d'olive"] },
  { titre: "Tajine d'agneau aux abricots", ingredients: ["agneau", "abricots secs", "oignon", "miel", "amandes", "semoule"] },

  // — Porc —
  { titre: "Rôti de porc aux carottes", ingredients: ["rôti de porc", "carottes", "oignon", "thym", "moutarde"] },
  { titre: "Sauté de porc au caramel", ingredients: ["porc", "sauce soja", "gingembre", "ail", "miel", "riz"] },
  { titre: "Quiche lorraine", ingredients: ["pâte brisée", "lardons", "œufs", "crème fraîche", "lait", "muscade"] },
  { titre: "Choucroute garnie", ingredients: ["choucroute", "saucisse", "lard", "pommes de terre", "vin blanc"] },

  // — Poissons & fruits de mer —
  { titre: "Saumon à l'oseille", ingredients: ["pavé de saumon", "crème fraîche", "oseille", "échalote", "beurre"] },
  { titre: "Cabillaud sauce citron", ingredients: ["cabillaud", "citron", "beurre", "persil", "riz"] },
  { titre: "Moules marinières", ingredients: ["moules", "vin blanc", "échalote", "persil", "beurre", "frites"] },
  { titre: "Risotto aux crevettes", ingredients: ["riz", "crevettes", "vin blanc", "parmesan", "oignon", "beurre"] },
  { titre: "Thon à la provençale", ingredients: ["thon", "tomates", "olives", "ail", "huile d'olive", "riz"] },
  { titre: "Brandade de morue", ingredients: ["morue", "pommes de terre", "lait", "ail", "huile d'olive"] },
  { titre: "Papillote de dorade aux légumes", ingredients: ["dorade", "courgette", "tomate", "citron", "huile d'olive"] },

  // — Végétarien (avec produits laitiers / œufs) —
  { titre: "Quiche aux légumes", ingredients: ["pâte brisée", "courgettes", "œufs", "crème fraîche", "fromage râpé"] },
  { titre: "Gratin dauphinois", ingredients: ["pommes de terre", "crème fraîche", "lait", "ail", "muscade"] },
  { titre: "Omelette aux champignons", ingredients: ["œufs", "champignons", "persil", "beurre", "sel"] },
  { titre: "Risotto aux champignons", ingredients: ["riz", "champignons", "parmesan", "oignon", "vin blanc", "beurre"] },
  { titre: "Gratin de courgettes", ingredients: ["courgettes", "crème fraîche", "œufs", "fromage râpé", "ail"] },
  { titre: "Tarte à la tomate et moutarde", ingredients: ["pâte feuilletée", "tomates", "moutarde", "fromage râpé", "herbes de Provence"] },
  { titre: "Pâtes carbonara", ingredients: ["pâtes", "lardons", "œufs", "parmesan", "poivre"] },
  { titre: "Macaronis au fromage", ingredients: ["macaronis", "fromage râpé", "lait", "beurre", "muscade"] },
  { titre: "Crêpes salées jambon fromage", ingredients: ["farine", "œufs", "lait", "jambon", "fromage râpé"] },
  { titre: "Croque-monsieur", ingredients: ["pain de mie", "jambon", "fromage", "béchamel", "beurre"] },

  // — Végétalien (vegan) —
  { titre: "Ratatouille", ingredients: ["aubergine", "courgette", "poivron", "tomates", "oignon", "ail", "huile d'olive"] },
  { titre: "Dahl de lentilles corail", ingredients: ["lentilles corail", "lait de coco", "oignon", "curcuma", "tomates", "riz"] },
  { titre: "Taboulé de semoule", ingredients: ["semoule", "tomates", "concombre", "menthe", "citron", "huile d'olive"] },
  { titre: "Curry de pois chiches", ingredients: ["pois chiches", "lait de coco", "épinards", "tomates", "curry", "riz"] },
  { titre: "Riz cantonais aux légumes", ingredients: ["riz", "petits pois", "carottes", "poivron", "sauce soja", "oignon"] },
  { titre: "Soupe de légumes", ingredients: ["carottes", "poireaux", "pommes de terre", "oignon", "navet"] },
  { titre: "Poêlée de légumes au tofu", ingredients: ["tofu", "brocoli", "carottes", "sauce soja", "gingembre", "riz"] },
  { titre: "Chili sin carne", ingredients: ["haricots rouges", "maïs", "tomates", "poivron", "oignon", "cumin", "riz"] },
  { titre: "Salade de quinoa aux légumes", ingredients: ["quinoa", "concombre", "tomates", "poivron", "citron", "huile d'olive"] },
  { titre: "Ratatouille de patate douce", ingredients: ["patate douce", "courgette", "tomates", "oignon", "ail", "huile d'olive"] },
  { titre: "Soupe à l'oignon", ingredients: ["oignon", "bouillon de légumes", "pain", "huile d'olive"] },
  { titre: "Boulettes de lentilles à la tomate", ingredients: ["lentilles", "chapelure", "oignon", "tomates", "ail", "persil"] },

  // — Pâtes & plats complets —
  { titre: "Spaghetti bolognaise", ingredients: ["spaghetti", "bœuf haché", "tomates", "oignon", "ail", "carotte"] },
  { titre: "Lasagnes bolognaises", ingredients: ["pâtes à lasagne", "bœuf haché", "tomates", "béchamel", "fromage râpé", "oignon"] },
  { titre: "Pâtes au pesto", ingredients: ["pâtes", "basilic", "pignons de pin", "parmesan", "ail", "huile d'olive"] },
  { titre: "Paella", ingredients: ["riz", "poulet", "crevettes", "moules", "poivron", "petits pois", "safran"] },
  { titre: "Couscous aux légumes", ingredients: ["semoule", "carottes", "courgettes", "pois chiches", "navet", "oignon"] },
  { titre: "Nouilles sautées au poulet", ingredients: ["nouilles", "blanc de poulet", "carottes", "sauce soja", "gingembre", "oignon"] },
  { titre: "Pizza margherita", ingredients: ["pâte à pizza", "tomates", "mozzarella", "basilic", "huile d'olive"] },
  { titre: "Galette de sarrasin complète", ingredients: ["farine de sarrasin", "œuf", "jambon", "fromage râpé"] },
];

/** Génère une clé de source stable à partir du titre. */
function slug(titre: string): string {
  return titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const recettesLocales: SourceDeRecettes = {
  nom: "locale",

  async chercher({ requete, limite }) {
    const filtre = requete?.trim().toLowerCase();
    const base = filtre
      ? RECETTES.filter((r) => r.titre.toLowerCase().includes(filtre))
      : RECETTES;
    const limitees = typeof limite === "number" ? base.slice(0, limite) : base;

    return limitees.map(
      (r): RecetteBrute => ({
        source: "locale",
        sourceRef: `locale-${slug(r.titre)}`,
        titre: r.titre,
        ingredientsTexte: r.ingredients,
      }),
    );
  },
};
