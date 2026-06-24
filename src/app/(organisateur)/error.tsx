"use client";

import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";

/**
 * Frontière d'erreur du segment organisateur : évite un 500 brut si une
 * dépendance (ex. base de données) est momentanément indisponible.
 */
export default function OrganisateurError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-12 text-center">
      <Banner variant="danger">
        Une erreur est survenue. Réessaie dans un instant.
      </Banner>
      <Button onClick={() => reset()}>Réessayer</Button>
    </main>
  );
}
