import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTH Madagascar - Centre de Traitement de l'Hémophilie",
  description: "Tableau de bord de gestion du Centre de Traitement de l'Hémophilie de Madagascar. Suivi des patients, stock de médicaments, prescriptions et rapports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
