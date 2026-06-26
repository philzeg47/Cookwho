import { Banner } from "~/components/ui/Banner";

/**
 * État affiché pour un lien participant inconnu/invalide.
 * Volontairement générique : aucune fuite d'information (on ne révèle pas
 * si le token a existé, ni de données d'un repas).
 */
export function LienInvalide() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Lien non valide</h1>
      <Banner variant="info" icon="🔗">
        Ce lien d&apos;invitation n&apos;est pas valide ou n&apos;est plus
        actif. Recontacte la personne qui organise le repas pour en obtenir un
        nouveau.
      </Banner>
    </div>
  );
}
