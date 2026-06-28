import { TRPCError } from "@trpc/server";

import { AssistantRestrictions } from "~/components/participant/AssistantRestrictions";
import { LienInvalide } from "~/components/participant/LienInvalide";
import { api } from "~/trpc/server";

// `no-referrer` : le token est dans l'URL — on évite qu'il fuite via l'en-tête
// `Referer` des ressources tierces chargées par la page.
export const metadata = {
  title: "Mon invitation — CookWho",
  referrer: "no-referrer" as const,
};

export default async function PageParticipant({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let acces;
  try {
    acces = await api.participant.monAcces({ token });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      return (
        <main
          id="contenu"
          className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-8"
        >
          <LienInvalide />
        </main>
      );
    }
    throw error;
  }

  return (
    <main
      id="contenu"
      className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8"
    >
      <AssistantRestrictions token={token} acces={acces} />
    </main>
  );
}
