"use client";

import { useEffect, useState } from "react";

/** Messages d'attente narratifs et rassurants (Voice & Tone, UX-DR5). */
const MESSAGES = [
  "On vérifie chaque assiette pour tout le monde…",
  "On compare avec les contraintes du groupe…",
  "Presque prêt, on dresse la table…",
] as const;

/**
 * État d'attente habillé pendant la génération (story 5.4, UX-DR4). Annoncé
 * aux lecteurs d'écran (`role="status"`, `aria-live`, `aria-busy`). Picto +
 * texte (jamais la couleur seule). UI pure : aucun appel réseau.
 */
export function EtatGenerationEnCours() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="bg-surface-muted text-ink flex items-center gap-3 rounded-lg px-4 py-6"
    >
      <span aria-hidden="true" className="text-2xl">
        🍳
      </span>
      <p className="font-medium">{MESSAGES[index]}</p>
    </div>
  );
}
