import { EtatVideRepas } from "~/components/organisateur/EtatVideRepas";

export const metadata = {
  title: "Mes repas — CookWho",
};

export default function MesRepasPage() {
  // V1 : aucune entité `Repas` (modèle introduit en story 2.1) → la liste est
  // vide par construction. On affiche l'état vide accueillant.
  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Mes repas</h1>
      <EtatVideRepas />
    </main>
  );
}
