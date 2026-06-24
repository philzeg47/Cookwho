"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { api } from "~/trpc/react";

export function CreerRepasForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const [lieu, setLieu] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");

  const creerRepas = api.organisateur.creerRepas.useMutation({
    onSuccess: async () => {
      await utils.organisateur.mesRepas.invalidate();
      router.push("/repas");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (creerRepas.isPending) return;
        // Midi (et non minuit) pour éviter tout décalage de jour selon le fuseau.
        creerRepas.mutate({ lieu, date: new Date(`${date}T12:00:00`), heure });
      }}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      {creerRepas.isError ? (
        <Banner variant="danger">
          La création a échoué. Vérifie le lieu, la date et l&apos;heure, puis
          réessaie.
        </Banner>
      ) : null}
      <Input
        id="lieu"
        label="Lieu"
        value={lieu}
        onChange={(e) => setLieu(e.target.value)}
        placeholder="Chez Léa, salle commune…"
        required
      />
      <Input
        id="date"
        type="date"
        label="Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Input
        id="heure"
        type="time"
        label="Heure"
        value={heure}
        onChange={(e) => setHeure(e.target.value)}
        required
      />
      <Button type="submit" disabled={creerRepas.isPending}>
        {creerRepas.isPending ? "Création…" : "Créer le repas"}
      </Button>
    </form>
  );
}
