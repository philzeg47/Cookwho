-- Ajoute l'indicateur "participant = organisateur" (l'organisateur est un
-- convive dont l'entrée est créée automatiquement, story de correctif).
ALTER TABLE "Participant" ADD COLUMN "estOrganisateur" BOOLEAN NOT NULL DEFAULT false;
