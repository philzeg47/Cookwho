import Link from "next/link";

import { EtatVideRepas } from "~/components/organisateur/EtatVideRepas";
import { RepasListe } from "~/components/organisateur/RepasListe";
import { Button } from "~/components/ui/Button";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Mes repas — CookWho",
};

export default async function MesRepasPage() {
  const repas = await api.organisateur.mesRepas();

  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8"
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Mes repas</h1>
        {repas.length > 0 ? (
          <Link href="/repas/creer">
            <Button>Créer un repas</Button>
          </Link>
        ) : null}
      </div>
      {repas.length === 0 ? <EtatVideRepas /> : <RepasListe repas={repas} />}
    </main>
  );
}
