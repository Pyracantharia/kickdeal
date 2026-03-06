import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "KickDeal — Plateforme de transferts football professionnelle",
  description:
    "La plateforme de transferts footballistiques nouvelle génération. Clubs et agents licenciés, négociez, gérez et finalisez vos transferts en toute sécurité.",
  keywords: [
    "transfert football",
    "agent sportif",
    "club football",
    "négociation transfert",
    "KickDeal",
  ],
  openGraph: {
    title: "KickDeal — Révolutionnez vos transferts",
    description:
      "La plateforme de transferts footballistiques nouvelle génération.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`min-h-screen ${rajdhani.variable} ${rajdhani.className}`}>
        <div className="fixed-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}