"use client";

import { useRef, useState } from "react";

import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";
import { SafeBadge } from "~/components/ui/SafeBadge";
import { EtapeAllergenes } from "~/components/participant/EtapeAllergenes";
import { EtapeNonAimes } from "~/components/participant/EtapeNonAimes";
import { EtapeRegime } from "~/components/participant/EtapeRegime";
import { LienInvalide } from "~/components/participant/LienInvalide";
import { RecapRestrictions } from "~/components/participant/RecapRestrictions";
import { SEUIL_TOLERANCE_DEFAUT } from "~/lib/restrictions";
import { api } from "~/trpc/react";

type RestrictionInitiale = {
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
  seuilTolerance: number | null;
};

type Acces = {
  prenom: string;
  statut: "EN_ATTENTE" | "REPONDU";
  repas: { lieu: string; date: Date; heure: string };
  restrictions: RestrictionInitiale[];
};

/**
 * État collecté par l'assistant (story 3.2b alimente ces structures).
 * - `regimes` : multi-select (cumul possible, ex. vegan + sans gluten).
 * - `seuilNonAimes` : curseur de tolérance GLOBAL appliqué à tous les non-aimés
 *   (décision UX : un seul curseur, pas un seuil par aliment).
 */
export type DonneesRestrictions = {
  regimes: string[];
  allergenes: string[];
  nonAimes: string[];
  seuilNonAimes: number;
};

const DONNEES_INITIALES: DonneesRestrictions = {
  regimes: [],
  allergenes: [],
  nonAimes: [],
  seuilNonAimes: SEUIL_TOLERANCE_DEFAUT,
};

const TITRES_ETAPES = [
  "Régime alimentaire",
  "Allergies",
  "Aliments non-aimés",
] as const;

const NB_ETAPES = TITRES_ETAPES.length;

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

type RestrictionPayload = {
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
  seuilTolerance?: number;
};

/**
 * Aplatit l'état de l'assistant vers le tableau attendu par l'API.
 * Trim + rejet du vide + déduplication par (type, valeur) côté client
 * (évite les aller-retours Zod et les lignes en double).
 */
function versRestrictions(donnees: DonneesRestrictions) {
  const restrictions: RestrictionPayload[] = [];
  const vues = new Set<string>();

  function ajouter(r: RestrictionPayload) {
    const valeur = r.valeur.trim();
    if (!valeur) return;
    const cle = `${r.type}::${valeur}`;
    if (vues.has(cle)) return;
    vues.add(cle);
    restrictions.push({ ...r, valeur });
  }

  for (const regime of donnees.regimes) {
    ajouter({ type: "REGIME", valeur: regime });
  }
  for (const allergene of donnees.allergenes) {
    ajouter({ type: "ALLERGIE", valeur: allergene });
  }
  for (const nonAime of donnees.nonAimes) {
    // Le seuil global est recopié sur chaque ligne NON_AIME.
    ajouter({
      type: "NON_AIME",
      valeur: nonAime,
      seuilTolerance: donnees.seuilNonAimes,
    });
  }
  return restrictions;
}

/**
 * Reconstruit l'état de l'assistant depuis les restrictions persistées
 * (inverse de `versRestrictions`, pour la réouverture — story 3.4).
 * Le seuil global est repris de la 1ʳᵉ ligne NON_AIME (toutes identiques à
 * l'écriture) ; à défaut, le seuil par défaut.
 */
export function versDonnees(
  restrictions: RestrictionInitiale[],
): DonneesRestrictions {
  const premierNonAime = restrictions.find((r) => r.type === "NON_AIME");
  return {
    regimes: restrictions.filter((r) => r.type === "REGIME").map((r) => r.valeur),
    allergenes: restrictions
      .filter((r) => r.type === "ALLERGIE")
      .map((r) => r.valeur),
    nonAimes: restrictions
      .filter((r) => r.type === "NON_AIME")
      .map((r) => r.valeur),
    seuilNonAimes: premierNonAime?.seuilTolerance ?? SEUIL_TOLERANCE_DEFAUT,
  };
}

/** (Dé)sélectionne une valeur dans un tableau (toggle, sans doublon). */
function basculer(liste: string[], valeur: string) {
  return liste.includes(valeur)
    ? liste.filter((v) => v !== valeur)
    : [...liste, valeur];
}

export function AssistantRestrictions({
  token,
  acces,
}: {
  token: string;
  acces: Acces;
}) {
  const dejaRepondu = acces.statut === "REPONDU";
  const [vue, setVue] = useState<
    "accueil" | "retour" | "stepper" | "confirme" | "lienInvalide"
  >(dejaRepondu ? "retour" : "accueil");
  const [etape, setEtape] = useState(0);
  // Pré-remplissage paresseux depuis les restrictions persistées (réouverture).
  const [donnees, setDonnees] = useState<DonneesRestrictions>(() =>
    dejaRepondu && acces.restrictions.length > 0
      ? versDonnees(acces.restrictions)
      : DONNEES_INITIALES,
  );
  const titreRef = useRef<HTMLHeadingElement>(null);

  const enregistrer = api.participant.enregistrerRestrictions.useMutation({
    onSuccess: () => setVue("confirme"),
    onError: (error) => {
      // Erreur TERMINALE (lien devenu invalide : repas expiré/purgé en cours de
      // session) → on bascule sur l'état « lien invalide », sans retry possible.
      // Une erreur transitoire (réseau, pas de `data.code`) reste sur le stepper
      // et déclenche le Banner « réessaie » via `isError`.
      if (error.data?.code === "NOT_FOUND") setVue("lienInvalide");
    },
  });

  function focusTitre() {
    // Déplace le focus sur le titre de l'étape entrante (lecteur d'écran).
    requestAnimationFrame(() => titreRef.current?.focus());
  }

  function demarrer() {
    setEtape(0);
    setVue("stepper");
    focusTitre();
  }

  function suivant() {
    setEtape((e) => Math.min(e + 1, NB_ETAPES - 1));
    focusTitre();
  }

  function precedent() {
    setEtape((e) => Math.max(e - 1, 0));
    focusTitre();
  }

  function valider() {
    if (enregistrer.isPending) return;
    enregistrer.mutate({ token, restrictions: versRestrictions(donnees) });
  }

  // Handlers d'étape — mutations ciblées de l'état collecté.
  function basculerRegime(valeur: string) {
    setDonnees((d) => ({ ...d, regimes: basculer(d.regimes, valeur) }));
  }
  function basculerAllergene(valeur: string) {
    setDonnees((d) => ({ ...d, allergenes: basculer(d.allergenes, valeur) }));
  }
  function ajouterAllergene(valeur: string) {
    setDonnees((d) =>
      d.allergenes.includes(valeur)
        ? d
        : { ...d, allergenes: [...d.allergenes, valeur] },
    );
  }
  function retirerAllergene(valeur: string) {
    setDonnees((d) => ({
      ...d,
      allergenes: d.allergenes.filter((a) => a !== valeur),
    }));
  }
  function ajouterNonAime(valeur: string) {
    setDonnees((d) =>
      d.nonAimes.includes(valeur)
        ? d
        : { ...d, nonAimes: [...d.nonAimes, valeur] },
    );
  }
  function retirerNonAime(valeur: string) {
    setDonnees((d) => ({
      ...d,
      nonAimes: d.nonAimes.filter((a) => a !== valeur),
    }));
  }
  function reglerSeuil(valeur: number) {
    setDonnees((d) => ({ ...d, seuilNonAimes: valeur }));
  }

  // Ouvre l'assistant pour modifier (depuis la confirmation OU l'écran de
  // retour d'un lien déjà répondu). Les saisies en cours / pré-remplies sont
  // conservées dans `donnees`.
  function modifier() {
    setEtape(0);
    setVue("stepper");
    focusTitre();
  }

  if (vue === "lienInvalide") {
    // Repas expiré/purgé pendant la session : message générique, sans retry.
    return <LienInvalide />;
  }

  if (vue === "accueil") {
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
          indiquer tes préférences et contraintes alimentaires. Ça prend moins
          de deux minutes, et tu n&apos;as aucun compte à créer.
        </p>

        <SafeBadge>
          Tes réponses ne servent qu&apos;à composer le repas
        </SafeBadge>

        <Button type="button" onClick={demarrer}>
          Déclarer mes restrictions
        </Button>
      </div>
    );
  }

  if (vue === "retour") {
    return (
      <div className="flex flex-col gap-6">
        <SafeBadge>On a déjà tes préférences</SafeBadge>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Re-bonjour {acces.prenom} 👋
          </h1>
          <p className="text-ink-soft">
            Tu nous as déjà indiqué tes préférences. Tu veux les modifier ?
          </p>
        </div>

        <RecapRestrictions donnees={donnees} />

        <Button type="button" onClick={modifier}>
          Modifier mes réponses
        </Button>
      </div>
    );
  }

  if (vue === "confirme") {
    return (
      <div className="flex flex-col gap-6">
        <SafeBadge>C&apos;est pris en compte</SafeBadge>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Merci {acces.prenom} !
          </h1>
          <p className="text-ink-soft">
            Tes préférences ont bien été enregistrées. L&apos;organisateur ne
            choisira que des plats qui te conviennent.
          </p>
        </div>

        <RecapRestrictions donnees={donnees} />

        <Button variant="secondary" type="button" onClick={modifier}>
          Modifier mes réponses
        </Button>
      </div>
    );
  }

  const estDerniere = etape === NB_ETAPES - 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-ink-soft text-sm font-semibold" aria-current="step">
          Étape {etape + 1} sur {NB_ETAPES}
        </p>
        <h1
          ref={titreRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight focus-visible:outline-none"
        >
          {TITRES_ETAPES[etape]}
        </h1>
      </div>

      <section aria-label={TITRES_ETAPES[etape]} className="min-h-24">
        {etape === 0 ? (
          <EtapeRegime regimes={donnees.regimes} onToggle={basculerRegime} />
        ) : null}
        {etape === 1 ? (
          <EtapeAllergenes
            allergenes={donnees.allergenes}
            onToggle={basculerAllergene}
            onAjouter={ajouterAllergene}
            onRetirer={retirerAllergene}
          />
        ) : null}
        {etape === 2 ? (
          <EtapeNonAimes
            nonAimes={donnees.nonAimes}
            seuil={donnees.seuilNonAimes}
            onAjouter={ajouterNonAime}
            onRetirer={retirerNonAime}
            onSeuil={reglerSeuil}
          />
        ) : null}
      </section>

      {enregistrer.isError ? (
        <Banner variant="danger">
          L&apos;enregistrement a échoué. Vérifie ta connexion et réessaie.
        </Banner>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {etape > 0 ? (
          <Button variant="secondary" type="button" onClick={precedent}>
            Précédent
          </Button>
        ) : (
          <span />
        )}

        {estDerniere ? (
          <Button
            type="button"
            onClick={valider}
            disabled={enregistrer.isPending}
          >
            {enregistrer.isPending ? "Enregistrement…" : "Valider"}
          </Button>
        ) : (
          <Button type="button" onClick={suivant}>
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
