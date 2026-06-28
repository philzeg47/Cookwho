import Link from "next/link";

import { Button } from "~/components/ui/Button";

/**
 * État vide accueillant de l'espace « Mes repas » (UX-DR4).
 * En V1 la liste est toujours vide (le modèle `Repas` arrive en story 2.1).
 */
export function EtatVideRepas() {
  return (
    <div className="border-edge bg-surface flex flex-col items-center gap-4 rounded-lg border px-6 py-12 text-center">
      <span aria-hidden="true" className="text-5xl">
        🍲
      </span>
      <h2 className="text-ink text-xl font-bold">Aucun repas pour l&apos;instant</h2>
      <p className="text-ink-soft max-w-sm">
        Créons le premier ensemble : un lieu, une date, et tes convives. CookWho
        s&apos;occupe du reste pour que personne ne soit laissé de côté.
      </p>
      <Link href="/repas/creer">
        <Button>Créer un repas</Button>
      </Link>
    </div>
  );
}
