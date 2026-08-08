import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoyerFacile | Gestion locative",
  description: "Gérez vos biens, locataires et paiements simplement.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
