import type { Metadata } from "next";
import "./globals.css";
import { Rajdhani } from "next/font/google";

export const metadata: Metadata = {
  title: "KickDeal",
  description: "Plateforme de transferts football",
};

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700",],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`min-h-screen ${rajdhani.className}`}>
        {children}
      </body>
    </html>
  );
}
