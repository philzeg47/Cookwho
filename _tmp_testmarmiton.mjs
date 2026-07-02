import { MarmitonQueryBuilder, searchRecipes } from "marmiton-api";
async function essai(label, requete) {
  try {
    const qs = new MarmitonQueryBuilder().withTitleContaining(requete).build();
    const t = Date.now();
    const r = await searchRecipes(qs);
    console.log(`[${label}] requete="${requete}" -> ${Array.isArray(r) ? r.length : "??"} resultats en ${Date.now()-t}ms`);
    if (Array.isArray(r) && r[0]) console.log(`   ex: ${r[0].name} | url=${r[0].url ? "ok" : "VIDE"} | ingr=${(r[0].ingredients||[]).length}`);
  } catch (e) {
    console.log(`[${label}] requete="${requete}" -> ERREUR: ${e?.message || e}`);
  }
}
await essai("vide (comme app)", "");
await essai("reelle", "poulet");
