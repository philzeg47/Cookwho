"use client";

import { useState } from "react";

import { Banner } from "~/components/ui/Banner";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { api } from "~/trpc/react";

export function AjouterParticipantForm({ repasId }: { repasId: string }) {
  const utils = api.useUtils();
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");

  const ajouter = api.organisateur.ajouterParticipant.useMutation({
    onSuccess: async () => {
      await utils.organisateur.repasDetail.invalidate({ repasId });
      setPrenom("");
      setEmail("");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ajouter.isPending) return;
        ajouter.mutate({ repasId, prenom, email });
      }}
      className="flex w-full flex-col gap-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Input
          id="prenom"
          label="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          required
        />
      </div>
      <div className="flex-1">
        <Input
          id="email"
          type="email"
          label="Email (optionnel)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom@exemple.fr"
        />
      </div>
      <Button type="submit" disabled={ajouter.isPending}>
        {ajouter.isPending ? "Ajout…" : "Ajouter"}
      </Button>
      {ajouter.isError ? (
        <div className="w-full">
          <Banner variant="danger">
            L&apos;ajout a échoué. Vérifie le prénom et l&apos;email, puis
            réessaie.
          </Banner>
        </div>
      ) : null}
    </form>
  );
}
