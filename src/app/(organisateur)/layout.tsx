import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "~/components/ui/Button";
import { auth, signOut } from "~/server/auth";

/**
 * Layout du segment organisateur : garde d'authentification.
 * Tout ce qui vit sous `(organisateur)` exige une session valide ;
 * sinon redirection vers `/connexion` (frontière orga/participant côté UI).
 */
export default async function OrganisateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-edge flex items-center justify-between border-b px-4 py-3">
        <Link href="/repas" className="text-lg font-bold tracking-tight">
          Cook<span className="text-primary-strong">Who</span>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/connexion" });
          }}
        >
          <Button variant="text" type="submit">
            Se déconnecter
          </Button>
        </form>
      </header>
      {children}
    </div>
  );
}
