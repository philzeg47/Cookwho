export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="bg-safe text-safe-text inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-sm font-semibold">
        ✓ Pour un repas qui convient à tous
      </span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Cook<span className="text-primary-strong">Who</span>
      </h1>
      <p className="text-ink-soft max-w-md text-lg">
        Organisez un repas de groupe où personne n&apos;est laissé de côté.
        La sécurité d&apos;abord, le plaisir ensuite.
      </p>
      <span className="bg-primary text-on-primary rounded-md px-5 py-2.5 text-sm font-semibold">
        Bientôt disponible
      </span>
    </main>
  );
}
