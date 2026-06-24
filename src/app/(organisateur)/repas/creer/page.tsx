import { CreerRepasForm } from "~/components/organisateur/CreerRepasForm";

export const metadata = {
  title: "Créer un repas — CookWho",
};

export default function CreerRepasPage() {
  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Créer un repas</h1>
      <CreerRepasForm />
    </main>
  );
}
