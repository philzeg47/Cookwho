// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({
  env: { AUTH_RESEND_KEY: "test-key", EMAIL_FROM: "CookWho <test@exemple.fr>" },
}));

import { envoyerEmail } from "./email";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("envoyerEmail", () => {
  it("appelle l'API Resend avec le bearer et l'expéditeur", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await envoyerEmail({
      to: "lea@exemple.fr",
      subject: "Sujet",
      html: "<p>Coucou</p>",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    const headers = (init!.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init!.body as string) as {
      from: string;
      to: string;
    };
    expect(body.from).toBe("CookWho <test@exemple.fr>");
    expect(body.to).toBe("lea@exemple.fr");
  });

  it("lève une erreur si la réponse n'est pas OK", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 422 }),
    );
    await expect(
      envoyerEmail({ to: "x@y.fr", subject: "s", html: "h" }),
    ).rejects.toThrow(/422/);
  });
});
