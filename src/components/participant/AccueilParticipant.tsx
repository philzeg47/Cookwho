import { SafeBadge } from "~/components/ui/SafeBadge";

// Type minimal de ce que ce composant utilise (découplé de la forme complète
// du retour de `monAcces`, qui porte aussi statut + restrictions depuis 3.4).
type Acces = {
  prenom: string;
  repas: { lieu: string; date: Date; heure: string };
};

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

export function AccueilParticipant({ acces }: { acces: Acces }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour {acces.prenom} 👋
        </h1>
        <p className="text-ink-soft">
          Tu es convié·e à un repas le{" "}
          <span className="text-ink font-semibold">
            {formatDate.format(acces.repas.date)} à {acces.repas.heure}
          </span>{" "}
          — {acces.repas.lieu}.
        </p>
      </div>

      <p className="text-ink-soft">
        Pour qu&apos;on choisisse un plat qui te convient, tu vas pouvoir
        indiquer tes préférences et contraintes alimentaires. Ça prend moins de
        deux minutes, et tu n&apos;as aucun compte à créer.
      </p>

      <SafeBadge>Tes réponses ne servent qu&apos;à composer le repas</SafeBadge>
    </div>
  );
}
