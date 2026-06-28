import "~/styles/globals.css";

import { type Metadata } from "next";
import { Nunito } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "CookWho",
  description: "Pour un repas qui convient à tous.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={nunito.variable}>
      <body className="bg-background text-ink font-sans">
        <a
          href="#contenu"
          className="focus:bg-primary focus:text-on-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:font-semibold"
        >
          Aller au contenu
        </a>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
