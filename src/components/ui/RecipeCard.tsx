import { Button } from "~/components/ui/Button";

export interface RecipeCardProps {
  titre: string;
  ingredients: string[];
  /** Ingrédients gênants + qui ils gênent (dégradation, story 5.2). */
  genants?: { valeur: string; genePar: string[] }[];
  /** Vrai si c'est le plat retenu du repas. */
  selectionne?: boolean;
  /** Choisir ce plat (omis → bouton masqué). */
  onChoisir?: () => void;
}

/**
 * Carte de recette (UX-DR2) : titre + ingrédients révélés à la demande
 * (disclosure native, accessible clavier) + action « Choisir ce plat ».
 * Réservée à l'organisateur (NFR5). Les ingrédients gênants (dégradation)
 * seront ajoutés en story 5.2.
 */
export function RecipeCard({
  titre,
  ingredients,
  genants = [],
  selectionne = false,
  onChoisir,
}: RecipeCardProps) {
  return (
    <article
      aria-current={selectionne ? "true" : undefined}
      className={`flex flex-col gap-3 rounded-lg border p-4 ${
        selectionne ? "border-safe bg-safe/10" : "border-edge bg-surface"
      }`}
    >
      <h3 className="text-lg font-bold">{titre}</h3>

      <details className="text-sm">
        <summary className="text-ink-soft min-h-11 cursor-pointer list-none py-1 font-medium focus-visible:ring-2 focus-visible:ring-primary-strong focus-visible:outline-none">
          Voir les ingrédients ({ingredients.length})
        </summary>
        <ul className="text-ink mt-2 list-disc pl-5">
          {ingredients.map((ingredient, i) => (
            <li key={`${i}-${ingredient}`}>{ingredient}</li>
          ))}
        </ul>
      </details>

      {genants.length > 0 ? (
        <div className="border-accent bg-accent/10 rounded-md border px-3 py-2 text-sm">
          <p className="text-ink inline-flex items-center gap-1.5 font-semibold">
            <span aria-hidden="true">⚠</span> Ingrédients qui gênent
          </p>
          <ul className="text-ink mt-1 list-disc pl-5">
            {genants.map((g) => (
              <li key={g.valeur}>
                {g.valeur}
                {g.genePar.length > 0 ? ` — gêne ${g.genePar.join(", ")}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selectionne ? (
        <p className="text-safe-text inline-flex items-center gap-1.5 font-semibold">
          <span aria-hidden="true">✓</span> Plat retenu
        </p>
      ) : onChoisir ? (
        <Button type="button" variant="primary" onClick={onChoisir}>
          Choisir ce plat
        </Button>
      ) : null}
    </article>
  );
}
