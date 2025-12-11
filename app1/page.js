// app/page.js
export default function HomePage() {
  return (
    <div
      style={{
        maxWidth: "600px",
        padding: "24px",
        borderRadius: "16px",
        background: "#0f172a",
        boxShadow: "0 20px 50px rgba(15,23,42,0.7)",
        border: "1px solid rgba(148,163,184,0.4)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "10px" }}>
        Test ImmoNext ✅
      </h1>
      <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "8px" }}>
        Si tu vois ce message, Next.js fonctionne bien.
      </p>
      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
        On ajoutera ensuite la vraie page SaaS + Login. Pour l’instant, on veut
        juste vérifier que l’interface s’affiche correctement.
      </p>
    </div>
  );
}
