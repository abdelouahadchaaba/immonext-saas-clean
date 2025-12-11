import "./globals.css";
import NavBar from "./NavBar";

export const metadata = {
  title: "ImmoNext - Plateforme immobilière SaaS",
  description: "SaaS multi-agences immobilières avec Next.js, Prisma, Supabase",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="root-body">
        <NavBar />
        <main className="root-main">{children}</main>
      </body>
    </html>
  );
}
