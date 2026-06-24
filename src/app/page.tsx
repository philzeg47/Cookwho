import { Button } from "~/components/ui/Button";
import { SafeBadge } from "~/components/ui/SafeBadge";

export default function Home() {
  return (
    <main
      id="contenu"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <SafeBadge>Pour un repas qui convient à tous</SafeBadge>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Cook<span className="text-primary-strong">Who</span>
      </h1>
      <p className="text-ink-soft max-w-md text-lg">
        Organisez un repas de groupe où personne n&apos;est laissé de côté. La
        sécurité d&apos;abord, le plaisir ensuite.
      </p>
      <Button>Bientôt disponible</Button>
    </main>
  );
}
