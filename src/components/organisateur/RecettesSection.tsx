"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";
import { RecipeCard } from "~/components/ui/RecipeCard";
import { SafeBadge } from "~/components/ui/SafeBadge";
import { api } from "~/trpc/react";
import { EtatGenerationEnCours } from "./EtatGenerationEnCours";

/**
 * Section « Recettes » du détail repas (story 5.1). Réservée organisateur
 * (NFR5). Affiche le chemin SUCCÈS (liste + badge + choix persisté) ; les états
 * riches sont d'autres stories (chargement → 5.4, gênants → 5.2, avertissement
 * allergie + validation → 5.3, échec explicatif → ultérieur).
 */
export function RecettesSection({
  repasId,
  platRetenuRef,
}: {
  repasId: string;
  platRetenuRef?: string | null;
}) {
  const router = useRouter();
  const generer = api.organisateur.genererRecettes.useMutation();
  const retenir = api.organisateur.retenirPlat.useMutation();
  const [retenuRef, setRetenuRef] = useState<string | null>(platRetenuRef ?? null);
  // Plat en attente de confirmation (human-in-the-loop allergie, 5.3).
  const [aValider, setAValider] = useState<{ ref: string; titre: string } | null>(null);

  const resultat = generer.data;
  const prenomsAllergie =
    resultat?.statut === "GENERE" ? resultat.prenomsAvecAllergie : [];

  function retenirPlat(ref: string, titre: string) {
    retenir.mutate(
      { repasId, ref, titre },
      {
        onSuccess: () => {
          setRetenuRef(ref);
          setAValider(null);
          router.refresh(); // rafraîchit le Server Component (« Menu retenu »)
        },
      },
    );
  }

  function choisir(ref: string, titre: string) {
    // Allergie dans le groupe → confirmation explicite obligatoire (FR16).
    if (prenomsAllergie.length > 0) setAValider({ ref, titre });
    else retenirPlat(ref, titre); // pas d'allergie → retient directement (5.1)
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Recettes</h2>

      <div>
        <Button
          type="button"
          disabled={generer.isPending}
          onClick={() => generer.mutate({ repasId })}
        >
          {generer.isPending
            ? "On cherche des plats…"
            : resultat
              ? "Régénérer"
              : "Générer des recettes"}
        </Button>
      </div>

      {generer.isError ? (
        <p className="text-danger-strong text-sm">
          ⚠ La génération a échoué. Réessaie.
        </p>
      ) : null}

      {aValider ? (
        <Banner variant="danger">
          <span>
            {prenomsAllergie.join(", ")} {prenomsAllergie.length > 1 ? "ont" : "a"}{" "}
            déclaré une allergie. Notre détection a déjà écarté les plats à risque
            connus, mais <strong>vérifie les ingrédients</strong> de «&nbsp;
            {aValider.titre}&nbsp;» avant de valider.
            <span className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                disabled={retenir.isPending}
                onClick={() => retenirPlat(aValider.ref, aValider.titre)}
              >
                Valider ce plat
              </Button>
              <Button type="button" variant="secondary" onClick={() => setAValider(null)}>
                Annuler
              </Button>
            </span>
          </span>
        </Banner>
      ) : null}

      {generer.isPending ? <EtatGenerationEnCours /> : null}

      {resultat?.statut === "ATTENTE_REPONSES" ? (
        <p className="text-ink-soft text-sm">
          {/* TODO 5.x : proposer la génération forcée + lister les non-couverts. */}
          Des invités n&apos;ont pas encore répondu.
        </p>
      ) : null}

      {resultat?.statut === "GENERE" && !resultat.resolution.ok ? (
        <p className="text-ink-soft text-sm">
          {/* TODO 5.3/échec : présentation des contraintes bloquantes. */}
          Aucun plat ne convient à tout le monde pour l&apos;instant.
        </p>
      ) : null}

      {resultat?.statut === "GENERE" && resultat.resolution.ok ? (
        <div className="flex flex-col gap-4">
          {resultat.resolution.mode === "TOUS_CONTENTS" ? (
            <SafeBadge>
              {resultat.resolution.recettes.length} plats compatibles avec tout le
              groupe
            </SafeBadge>
          ) : (
            <Banner variant="info">
              Aucun plat ne plaît à tout le monde côté goûts — voici ceux qui
              froissent le moins. La sécurité, elle, reste garantie.
            </Banner>
          )}
          <ul className="flex flex-col gap-3">
            {resultat.resolution.recettes.map((r) => (
              <li key={r.ref}>
                <RecipeCard
                  titre={r.titre}
                  ingredients={r.ingredients}
                  genants={r.ingredientsGenants.map((valeur) => ({
                    valeur,
                    genePar: resultat.genantsParConvive[valeur] ?? [],
                  }))}
                  selectionne={r.ref === retenuRef}
                  onChoisir={() => choisir(r.ref, r.titre)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
