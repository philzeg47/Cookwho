import { env } from "~/env";

/**
 * Envoi d'email via l'API HTTP Resend (réutilise la clé du provider Auth.js
 * de la story 1.3, sans dépendance supplémentaire).
 *
 * NFR6 : ne JAMAIS logger le destinataire ni le contenu (données personnelles).
 */
export async function envoyerEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.AUTH_RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    // Le corps Resend porte la cause réelle (domaine non vérifié, quota…) ;
    // utile au diagnostic serveur. Pas de donnée de santé ici (NFR6).
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Échec de l'envoi de l'email (statut ${res.status})${detail ? ` : ${detail}` : ""}`,
    );
  }
}
