// app/layout.js
import "./globals.css";

export const metadata = {
  title: "ImmoNext - Mini plateforme immobilière",
  description: "Mini backoffice immobilier avec Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          background: "#020617",
          color: "#e5e7eb",
          minHeight: "100vh",
          display: "flex",
        }}
      >
        {/* PAS de NavBar pour le moment, juste le contenu */}
        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
