"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  type DonneesRestrictions,
  versDonnees,
  versRestrictions,
} from "~/components/participant/AssistantRestrictions";
import { EtapeAllergenes } from "~/components/participant/EtapeAllergenes";
import { EtapeNonAimes } from "~/components/participant/EtapeNonAimes";
import { EtapeRegime } from "~/components/participant/EtapeRegime";
import { RecapRestrictions } from "~/components/participant/RecapRestrictions";
import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";
import { api } from "~/trpc/react";

type RestrictionInitiale = {
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
  seuilTolerance: number | null;
};

function basculer(liste: string[], valeur: string) {
  return liste.includes(valeur)
    ? liste.filter((v) => v !== valeur)
    : [...liste, valeur];
}

/**
 * Bloc « Mes restrictions » de l'organisateur (il est un convive : ses
 * contraintes comptent dans la génération). Réutilise les étapes de l'assistant
 * participant, mais en une seule page et via une mutation authentifiée.
 */
export function MesRestrictions({
  repasId,
  initiales,
  aRepondu,
}: {
  repasId: string;
  initiales: RestrictionInitiale[];
  aRepondu: boolean;
}) {
  const router = useRouter();
  const [edition, setEdition] = useState(!aRepondu);
  const [donnees, setDonnees] = useState<DonneesRestrictions>(() =>
    versDonnees(initiales),
  );

  const enregistrer = api.organisateur.enregistrerMesRestrictions.useMutation({
    onSuccess: () => {
      setEdition(false);
      router.refresh();
    },
  });

  if (!edition) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Mes restrictions</h2>
        <RecapRestrictions donnees={donnees} />
        <Button variant="secondary" type="button" onClick={() => setEdition(true)}>
          Modifier mes restrictions
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Mes restrictions</h2>
      <p className="text-ink-soft text-sm">
        Tu es un convive aussi — tes contraintes sont prises en compte dans les
        recettes générées.
      </p>

      <EtapeRegime
        regimes={donnees.regimes}
        onToggle={(v) => setDonnees((d) => ({ ...d, regimes: basculer(d.regimes, v) }))}
      />
      <EtapeAllergenes
        allergenes={donnees.allergenes}
        onToggle={(v) =>
          setDonnees((d) => ({ ...d, allergenes: basculer(d.allergenes, v) }))
        }
        onAjouter={(v) =>
          setDonnees((d) =>
            d.allergenes.includes(v) ? d : { ...d, allergenes: [...d.allergenes, v] },
          )
        }
        onRetirer={(v) =>
          setDonnees((d) => ({ ...d, allergenes: d.allergenes.filter((a) => a !== v) }))
        }
      />
      <EtapeNonAimes
        nonAimes={donnees.nonAimes}
        seuil={donnees.seuilNonAimes}
        onAjouter={(v) =>
          setDonnees((d) =>
            d.nonAimes.includes(v) ? d : { ...d, nonAimes: [...d.nonAimes, v] },
          )
        }
        onRetirer={(v) =>
          setDonnees((d) => ({ ...d, nonAimes: d.nonAimes.filter((a) => a !== v) }))
        }
        onSeuil={(v) => setDonnees((d) => ({ ...d, seuilNonAimes: v }))}
      />

      {enregistrer.isError ? (
        <Banner variant="danger">
          L&apos;enregistrement a échoué. Réessaie.
        </Banner>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={enregistrer.isPending}
          onClick={() =>
            enregistrer.mutate({ repasId, restrictions: versRestrictions(donnees) })
          }
        >
          {enregistrer.isPending ? "Enregistrement…" : "Enregistrer mes restrictions"}
        </Button>
        {aRepondu ? (
          <Button
            variant="text"
            type="button"
            onClick={() => {
              setDonnees(versDonnees(initiales));
              setEdition(false);
            }}
          >
            Annuler
          </Button>
        ) : null}
      </div>
    </section>
  );
}
