import Link from "next/link";

import { Banner } from "~/components/ui/Banner";

export const metadata = {
  title: "Vérifie ta boîte mail — CookWho",
};

export default function VerifierPage() {
  return (
    <main
      id="contenu"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Vérifie ta boîte mail
      </h1>
      <div className="w-full max-w-md">
        <Banner variant="info" icon="📬">
          On t&apos;a envoyé un lien de connexion. Clique dessus depuis cet
          appareil pour accéder à ton espace. Le lien expire bientôt, et ne
          fonctionne qu&apos;une fois.
        </Banner>
      </div>
      <p className="text-ink-soft max-w-md">
        Rien reçu ? Pense à regarder dans les spams, ou{" "}
        <Link href="/connexion" className="text-primary-strong underline">
          réessaie avec ton email
        </Link>
        .
      </p>
    </main>
  );
}
