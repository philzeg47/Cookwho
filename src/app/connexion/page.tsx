import { redirect } from "next/navigation";

import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { signIn } from "~/server/auth";

export const metadata = {
  title: "Se connecter — CookWho",
};

/** Vrai pour la « pseudo-erreur » de redirection Next (succès), à relancer telle quelle. */
function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main
      id="contenu"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Se connecter à Cook<span className="text-primary-strong">Who</span>
      </h1>
      <p className="text-ink-soft max-w-md text-lg">
        Entre ton email : on t&apos;envoie un lien de connexion, sans mot de
        passe à retenir.
      </p>
      {error ? (
        <div className="w-full max-w-sm">
          <Banner variant="danger">
            L&apos;envoi du lien a échoué. Vérifie ton adresse et réessaie.
          </Banner>
        </div>
      ) : null}
      <form
        action={async (formData: FormData) => {
          "use server";
          const email = String(formData.get("email") ?? "").trim();
          try {
            await signIn("resend", { email, redirectTo: "/repas" });
          } catch (err) {
            // Le succès de signIn lève aussi une redirection Next : on la relaie.
            if (isNextRedirect(err)) throw err;
            redirect("/connexion?error=envoi");
          }
        }}
        className="flex w-full max-w-sm flex-col gap-4 text-left"
      >
        <Input
          id="email"
          name="email"
          type="email"
          label="Ton email"
          placeholder="prenom@exemple.fr"
          autoComplete="email"
          required
        />
        <Button type="submit">Recevoir mon lien de connexion</Button>
      </form>
    </main>
  );
}
