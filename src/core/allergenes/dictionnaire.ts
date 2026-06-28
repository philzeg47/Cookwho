// Dictionnaire MAISON ingrédient → allergène(s)/dérivés (couche allergènes
// interne, FR13). Module /core PUR (zéro I/O) : aucune dépendance périphérie.
//
// CONVENTION DE CLÉ NORMALISÉE (`ingredient`) : minuscules, SANS accents ni
// diacritiques (forme NFD), espaces simples, singulier privilégié. C'est le
// contrat que `normalize()` (story 4.1) devra produire pour matcher. Ici on
// stocke les clés DÉJÀ sous cette forme. Aucune détection n'est faite en 4.0.
//
// PROVENANCE (auditabilité, NFR3) : « UE 1169/2011 Annexe II » pour le
// rattachement réglementaire de l'allergène ; « maison » pour les dérivés et
// heuristiques ajoutés à la main.

import type { AllergeneUE } from "./allergenes-ue";

export type EntreeDictionnaire = {
  /** Clé normalisée (cf. convention ci-dessus). */
  ingredient: string;
  /** Allergène(s) UE portés par cet ingrédient (≥ 1). */
  allergenes: AllergeneUE[];
  /** Origine du mapping (non vide). */
  provenance: string;
};

const REG = "UE 1169/2011 Annexe II";
const MAISON = "maison";

export const DICTIONNAIRE_ALLERGENES: readonly EntreeDictionnaire[] = [
  // — Gluten (céréales) —
  { ingredient: "ble", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "farine de ble", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "ble dur", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "epeautre", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "seigle", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "orge", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "avoine", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "pates", allergenes: ["GLUTEN"], provenance: MAISON },
  { ingredient: "pain", allergenes: ["GLUTEN"], provenance: MAISON },
  { ingredient: "chapelure", allergenes: ["GLUTEN"], provenance: MAISON },
  { ingredient: "semoule", allergenes: ["GLUTEN"], provenance: MAISON },
  { ingredient: "boulgour", allergenes: ["GLUTEN"], provenance: MAISON },
  { ingredient: "biere", allergenes: ["GLUTEN"], provenance: MAISON },
  { ingredient: "gluten", allergenes: ["GLUTEN"], provenance: REG },
  { ingredient: "couscous", allergenes: ["GLUTEN"], provenance: MAISON },
  { ingredient: "gnocchi", allergenes: ["GLUTEN"], provenance: MAISON },

  // — Crustacés —
  { ingredient: "crevette", allergenes: ["CRUSTACES"], provenance: REG },
  { ingredient: "gambas", allergenes: ["CRUSTACES"], provenance: MAISON },
  { ingredient: "crabe", allergenes: ["CRUSTACES"], provenance: REG },
  { ingredient: "homard", allergenes: ["CRUSTACES"], provenance: REG },
  { ingredient: "langoustine", allergenes: ["CRUSTACES"], provenance: REG },
  { ingredient: "ecrevisse", allergenes: ["CRUSTACES"], provenance: REG },
  { ingredient: "tourteau", allergenes: ["CRUSTACES"], provenance: MAISON },
  { ingredient: "crustace", allergenes: ["CRUSTACES"], provenance: REG },
  // Terme générique : couvre crustacés ET mollusques (sens conservateur).
  { ingredient: "fruits de mer", allergenes: ["CRUSTACES", "MOLLUSQUES"], provenance: MAISON },

  // — Œufs —
  { ingredient: "oeuf", allergenes: ["OEUFS"], provenance: REG },
  { ingredient: "jaune d'oeuf", allergenes: ["OEUFS"], provenance: REG },
  { ingredient: "blanc d'oeuf", allergenes: ["OEUFS"], provenance: REG },
  { ingredient: "mayonnaise", allergenes: ["OEUFS"], provenance: MAISON },
  { ingredient: "meringue", allergenes: ["OEUFS"], provenance: MAISON },

  // — Poisson —
  { ingredient: "poisson", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "saumon", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "thon", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "cabillaud", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "anchois", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "sardine", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "maquereau", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "truite", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "dorade", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "sole", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "hareng", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "lotte", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "colin", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "merlu", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "bar", allergenes: ["POISSON"], provenance: REG },
  { ingredient: "sauce nuoc-mam", allergenes: ["POISSON"], provenance: MAISON },
  { ingredient: "nuoc-mam", allergenes: ["POISSON"], provenance: MAISON },
  { ingredient: "surimi", allergenes: ["POISSON", "CRUSTACES"], provenance: MAISON },

  // — Arachides —
  { ingredient: "arachide", allergenes: ["ARACHIDES"], provenance: REG },
  { ingredient: "cacahuete", allergenes: ["ARACHIDES"], provenance: REG },
  { ingredient: "huile d'arachide", allergenes: ["ARACHIDES"], provenance: MAISON },
  { ingredient: "beurre de cacahuete", allergenes: ["ARACHIDES"], provenance: MAISON },

  // — Soja —
  { ingredient: "soja", allergenes: ["SOJA"], provenance: REG },
  { ingredient: "sauce soja", allergenes: ["SOJA"], provenance: MAISON },
  { ingredient: "tofu", allergenes: ["SOJA"], provenance: MAISON },
  { ingredient: "edamame", allergenes: ["SOJA"], provenance: MAISON },
  { ingredient: "lecithine de soja", allergenes: ["SOJA"], provenance: MAISON },
  { ingredient: "miso", allergenes: ["SOJA"], provenance: MAISON },

  // — Lait —
  { ingredient: "lait", allergenes: ["LAIT"], provenance: REG },
  { ingredient: "beurre", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "creme", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "creme fraiche", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "fromage", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "yaourt", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "caseine", allergenes: ["LAIT"], provenance: REG },
  { ingredient: "lactose", allergenes: ["LAIT"], provenance: REG },
  { ingredient: "parmesan", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "mozzarella", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "gruyere", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "emmental", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "comte", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "cheddar", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "feta", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "ricotta", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "chevre", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "raclette", allergenes: ["LAIT"], provenance: MAISON },
  { ingredient: "mascarpone", allergenes: ["LAIT"], provenance: MAISON },

  // — Fruits à coque —
  { ingredient: "amande", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "noisette", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "noix", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "noix de cajou", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "pistache", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "noix de pecan", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "noix de macadamia", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "noix du bresil", allergenes: ["FRUITS_A_COQUE"], provenance: REG },
  { ingredient: "pralin", allergenes: ["FRUITS_A_COQUE"], provenance: MAISON },
  { ingredient: "fruits a coque", allergenes: ["FRUITS_A_COQUE"], provenance: REG },

  // — Céleri —
  { ingredient: "celeri", allergenes: ["CELERI"], provenance: REG },
  { ingredient: "celeri-rave", allergenes: ["CELERI"], provenance: MAISON },
  { ingredient: "sel de celeri", allergenes: ["CELERI"], provenance: MAISON },

  // — Moutarde —
  { ingredient: "moutarde", allergenes: ["MOUTARDE"], provenance: REG },
  { ingredient: "graines de moutarde", allergenes: ["MOUTARDE"], provenance: MAISON },

  // — Sésame —
  { ingredient: "sesame", allergenes: ["SESAME"], provenance: REG },
  { ingredient: "graines de sesame", allergenes: ["SESAME"], provenance: REG },
  { ingredient: "tahin", allergenes: ["SESAME"], provenance: MAISON },
  { ingredient: "huile de sesame", allergenes: ["SESAME"], provenance: MAISON },

  // — Sulfites (anhydride sulfureux) —
  { ingredient: "sulfites", allergenes: ["SULFITES"], provenance: REG },
  { ingredient: "anhydride sulfureux", allergenes: ["SULFITES"], provenance: REG },
  { ingredient: "vin", allergenes: ["SULFITES"], provenance: MAISON },
  { ingredient: "vinaigre de vin", allergenes: ["SULFITES"], provenance: MAISON },

  // — Lupin —
  { ingredient: "lupin", allergenes: ["LUPIN"], provenance: REG },
  { ingredient: "farine de lupin", allergenes: ["LUPIN"], provenance: MAISON },

  // — Mollusques —
  { ingredient: "moule", allergenes: ["MOLLUSQUES"], provenance: REG },
  { ingredient: "huitre", allergenes: ["MOLLUSQUES"], provenance: REG },
  { ingredient: "calamar", allergenes: ["MOLLUSQUES"], provenance: REG },
  { ingredient: "poulpe", allergenes: ["MOLLUSQUES"], provenance: REG },
  { ingredient: "seiche", allergenes: ["MOLLUSQUES"], provenance: REG },
  { ingredient: "coquille saint-jacques", allergenes: ["MOLLUSQUES"], provenance: MAISON },
  { ingredient: "escargot", allergenes: ["MOLLUSQUES"], provenance: MAISON },
  { ingredient: "coquillage", allergenes: ["MOLLUSQUES"], provenance: MAISON },
  { ingredient: "mollusque", allergenes: ["MOLLUSQUES"], provenance: REG },
  { ingredient: "bulot", allergenes: ["MOLLUSQUES"], provenance: REG },
];
