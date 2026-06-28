// Orchestrateur de génération de recettes (FR9). Compose la périphérie
// (DB, source/cache) et le noyau /core (detect → mur → resoudre). Fonction
// prenant `db` + `source` en paramètres (façon purge.ts / cache.ts) → testable
// sans réseau ni base réelle.

import { TRPCError } from "@trpc/server";

import {
  construireContraintes,
  detect,
  detecterProprietes,
  type NonAime,
  type ResultatResolution,
  resoudre,
} from "~/core";
import { SEUIL_TOLERANCE_DEFAUT } from "~/lib/restrictions";
import { recupererRecettes } from "~/server/sources/cache";
import type { RecetteBrute, SourceDeRecettes } from "~/server/sources/SourceDeRecettes";

type RestrictionRow = {
  type: "REGIME" | "ALLERGIE" | "NON_AIME";
  valeur: string;
  seuilTolerance: number | null;
};
type ParticipantRow = {
  prenom: string;
  statut: "EN_ATTENTE" | "REPONDU";
  restrictions: RestrictionRow[];
};

// `db` doit satisfaire à la fois l'accès `repas` et le contrat du cache (4.2).
// Type structurel (testable avec un mock) ; le router caste `ctx.db` dessus.
export type DbGeneration = {
  repas: {
    findFirst: (
      args: unknown,
    ) => Promise<{ participants: ParticipantRow[] } | null>;
  };
  recetteCache: {
    findMany: (args: unknown) => Promise<RecetteBrute[]>;
    upsert: (args: unknown) => Promise<unknown>;
  };
};

export type OptionsGeneration = {
  repasId: string;
  organisateurId: string;
  exclure?: string[];
  requete?: string;
  /** Taille du pool de recettes à récupérer avant filtrage (assez pour ≥ 3). */
  limite?: number;
  /** Générer malgré des réponses manquantes (story 4.7, FR12). Défaut : false. */
  forcer?: boolean;
};

/**
 * Enveloppe l'état de génération (serveur) autour du `ResultatResolution` (/core) :
 *  - ATTENTE_REPONSES : des participants n'ont pas répondu et l'organisateur n'a
 *    pas forcé → on NE génère PAS (pas d'appel source), on liste les non-couverts.
 *  - GENERE : génération faite. `force` est vrai si elle a ignoré des manquants
 *    (`nonCouverts` les nomme, pour l'avertissement). Le mur n'est jamais affaibli.
 *    `genantsParConvive` (5.2) : aliment non-aimé → prénoms des répondants qui
 *    l'ont déclaré, pour signaler « qui » est gêné par une recette dégradée.
 *    `prenomsAvecAllergie` (5.3) : prénoms des répondants ayant déclaré une
 *    allergie, pour l'avertissement human-in-the-loop avant de retenir (FR16).
 */
export type ResultatGeneration =
  | { statut: "ATTENTE_REPONSES"; nonCouverts: string[] }
  | {
      statut: "GENERE";
      force: boolean;
      nonCouverts: string[];
      resolution: ResultatResolution;
      genantsParConvive: Record<string, string[]>;
      prenomsAvecAllergie: string[];
    };

export async function genererPourRepas(
  db: DbGeneration,
  source: SourceDeRecettes,
  {
    repasId,
    organisateurId,
    exclure,
    requete,
    limite = 40,
    forcer = false,
  }: OptionsGeneration,
): Promise<ResultatGeneration> {
  // Frontière de sécurité : le repas doit appartenir à l'organisateur connecté.
  const repas = await db.repas.findFirst({
    where: { id: repasId, organisateurId },
    include: { participants: { include: { restrictions: true } } },
  });
  if (!repas) throw new TRPCError({ code: "NOT_FOUND" });

  // Participants non couverts = ceux qui n'ont pas encore répondu (prénoms).
  const nonCouverts = repas.participants
    .filter((p) => p.statut === "EN_ATTENTE")
    .map((p) => p.prenom);

  // Gate : sans forçage, des réponses manquantes bloquent la génération
  // (court-circuit AVANT la source — aucun appel réseau/cache inutile).
  if (nonCouverts.length > 0 && !forcer) {
    return { statut: "ATTENTE_REPONSES", nonCouverts };
  }

  // Chemin nominal : seules les restrictions des participants ayant RÉPONDU
  // comptent. La génération forcée n'invente RIEN pour les absents — leur
  // risque est porté par l'avertissement `nonCouverts`, jamais par le mur.
  const restrictions = repas.participants
    .filter((p) => p.statut === "REPONDU")
    .flatMap((p) => p.restrictions);

  const contraintes = construireContraintes(restrictions);
  const nonAimes: NonAime[] = restrictions
    .filter((r) => r.type === "NON_AIME")
    .map((r) => ({
      valeur: r.valeur,
      seuilTolerance: r.seuilTolerance ?? SEUIL_TOLERANCE_DEFAUT,
    }));

  // Récupération via source/cache (fetch-through + résilience, 4.2).
  const recettes = await recupererRecettes(db, source, { requete, limite });

  // Pipeline : détection des allergènes (4.1b) + des propriétés régime (4.3b)
  // AVANT /core resoudre.
  const entrees = recettes.map((r) => ({
    ref: r.sourceRef,
    titre: r.titre,
    ingredients: r.ingredientsTexte,
    detection: detect(r.ingredientsTexte),
    detectionProprietes: detecterProprietes(r.ingredientsTexte),
  }));

  const resolution = resoudre(entrees, contraintes, nonAimes, { exclure });

  // Attribution « qui est gêné » (5.2) : non-aimé (valeur) → prénoms des
  // répondants l'ayant déclaré. L'UI résout les `ingredientsGenants` d'une
  // recette via ce mapping. `/core` reste inchangé.
  // Prénoms dédupliqués par `Set` (lignes dupliquées ou convives homonymes).
  const genantsSets: Record<string, Set<string>> = {};
  const allergieSet = new Set<string>();
  for (const p of repas.participants) {
    if (p.statut !== "REPONDU") continue;
    let aAllergie = false;
    for (const r of p.restrictions) {
      if (r.type === "NON_AIME") (genantsSets[r.valeur] ??= new Set()).add(p.prenom);
      else if (r.type === "ALLERGIE") aAllergie = true;
    }
    if (aAllergie) allergieSet.add(p.prenom);
  }
  const genantsParConvive: Record<string, string[]> = Object.fromEntries(
    Object.entries(genantsSets).map(([valeur, set]) => [valeur, [...set]]),
  );

  return {
    statut: "GENERE",
    force: nonCouverts.length > 0,
    nonCouverts,
    resolution,
    genantsParConvive,
    prenomsAvecAllergie: [...allergieSet],
  };
}
