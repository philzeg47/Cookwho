// Déclaration ambient minimale pour `marmiton-api` v3 : le package livre des
// types mais ne les expose pas via `package.json#types`. On déclare seulement
// le sous-ensemble utilisé par `marmitonSource.ts` (surface isolée).
declare module "marmiton-api" {
  export interface Recipe {
    name: string;
    url: string;
    ingredients: string[];
  }
  export function searchRecipes(
    qs: string,
    opt?: unknown,
  ): Promise<Recipe[]>;
  export class MarmitonQueryBuilder {
    withTitleContaining(titre: string): this;
    build(): string;
  }
}
