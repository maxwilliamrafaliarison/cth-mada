import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTH Madagascar - Centre de Traitement de l'Hémophilie",
  description: "Tableau de bord de gestion du Centre de Traitement de l'Hémophilie de Madagascar. Suivi des patients, stock de médicaments, prescriptions et rapports.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64 48x48 32x32 16x16', type: 'image/x-icon' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
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
