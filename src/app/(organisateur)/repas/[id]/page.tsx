import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { AjouterParticipantForm } from "~/components/organisateur/AjouterParticipantForm";
import { ParticipantsListe } from "~/components/organisateur/ParticipantsListe";
import { SuiviReponses } from "~/components/organisateur/SuiviReponses";
import { api } from "~/trpc/server";

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

export default async function RepasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let repas;
  try {
    repas = await api.organisateur.repasDetail({ repasId: id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{repas.lieu}</h1>
        <p className="text-ink-soft">
          {formatDate.format(repas.date)} à {repas.heure}
        </p>
      </header>

      <SuiviReponses participants={repas.participants} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Participants</h2>
        <AjouterParticipantForm repasId={repas.id} />
        <ParticipantsListe participants={repas.participants} />
      </section>
    </main>
  );
}
