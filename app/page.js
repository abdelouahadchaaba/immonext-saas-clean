"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const [me, setMe] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const u = data?.user || data || null;
          setMe(u);
        } else {
          setMe(null);
        }
      } catch {
        setMe(null);
      } finally {
        setAuthChecked(true);
      }
    }

    loadMe();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoggingIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Échec de la connexion");
      }

      // après connexion → on va vers les annonces (ou agences si tu préfères)
      router.push("/annonces");
    } catch (err) {
      setError(err.message || "Erreur lors de la connexion");
    } finally {
      setLoggingIn(false);
    }
  }

  const hasAgency = !!me?.agencyId;
  const isSuperAdmin = me?.role === "SUPER_ADMIN";

  return (
    <div className="page">
      {/* HERO PRINCIPAL */}
      <section
        className="panel"
        style={{
          marginBottom: 16,
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.28), transparent 60%), radial-gradient(circle at bottom right, rgba(34,197,94,0.22), transparent 60%)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.1fr)",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          {/* COLONNE GAUCHE : texte marketing */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h1
              className="page-title"
              style={{
                fontSize: "2rem",
                marginBottom: 4,
                background:
                  "linear-gradient(135deg, #4f46e5, #06b6d4, #22c55e)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              ImmoNext – La plateforme SaaS des agences immobilières modernes
            </h1>

            <p
              className="page-subtitle"
              style={{ maxWidth: 620, marginBottom: 4 }}
            >
              Centralise tes agences, tes annonces et toutes tes photos dans une
              seule plateforme. ImmoNext est pensée pour les réseaux
              immobiliers, les agences indépendantes et les investisseurs
              partout dans le monde.
            </p>

            {authChecked && me && (
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#bbf7d0",
                  marginTop: 4,
                }}
              >
                Bonjour{" "}
                <strong>{me.name || me.email}</strong>
                {hasAgency
                  ? " — tu peux gérer tes annonces depuis le menu Annonces."
                  : " — tu peux explorer la vitrine ImmoNext et découvrir les biens des agences."}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
              }}
            >
              <Link href="/galerie">
                <button
                  className="btn-outline"
                  style={{
                    background:
                      "linear-gradient(135deg, #4f46e5, #06b6d4, #22c55e)",
                    color: "#020617",
                    fontWeight: 600,
                    borderColor: "transparent",
                  }}
                >
                  🌍 Voir la vitrine des annonces
                </button>
              </Link>

              {authChecked && !me && (
                <>
                  <Link href="/register">
                    <button className="btn-outline">
                      🏢 Créer une agence ou un compte
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="btn-outline">🔑 Page de connexion</button>
                  </Link>
                </>
              )}

              {authChecked && me && hasAgency && (
                <Link href="/annonces">
                  <button className="btn-outline">📋 Gérer mes annonces</button>
                </Link>
              )}

              {authChecked && me && !hasAgency && (
                <Link href="/register">
                  <button className="btn-outline">
                    🏢 Devenir agence partenaire
                  </button>
                </Link>
              )}

              {authChecked && isSuperAdmin && (
                <Link href="/agences">
                  <button className="btn-outline">🌐 Gérer les agences</button>
                </Link>
              )}
            </div>

            {/* Bandeau avantages */}
            <div
              style={{
                marginTop: 16,
                padding: "9px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.5)",
                background:
                  "linear-gradient(135deg, rgba(15,118,110,0.9), rgba(30,64,175,0.9))",
                fontSize: "0.78rem",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span>✅ Multi-agences & multi-pays</span>
              <span>✅ Galerie photos avec slider</span>
              <span>✅ Rôles : Super Admin, agence, visiteur</span>
              <span>✅ SaaS prêt pour un trafic mondial</span>
            </div>
          </div>

          {/* COLONNE DROITE : bloc login type "popup" */}
          <div
            className="hero-card"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background:
                "radial-gradient(circle at top, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
            }}
          >
            <div>
              <h2 className="hero-title" style={{ fontSize: "1.35rem" }}>
                Connexion à ImmoNext
              </h2>
              <p
                className="hero-subtitle"
                style={{
                  fontSize: "0.9rem",
                  marginBottom: 12,
                }}
              >
                Accède à ton espace (agence ou simple utilisateur) avec ton
                email et mot de passe.  
                Tu pourras ensuite gérer tes annonces ou explorer la vitrine.
              </p>

              <form
                onSubmit={handleLogin}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <input
                  type="email"
                  placeholder="Email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Mot de passe *"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {error && (
                  <p
                    style={{
                      color: "#fecaca",
                      fontSize: "0.8rem",
                      marginTop: "2px",
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-outline"
                  disabled={loggingIn}
                  style={{ marginTop: "4px" }}
                >
                  {loggingIn ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <p
                style={{
                  marginTop: 10,
                  fontSize: "0.78rem",
                  opacity: 0.9,
                }}
              >
                Nouvel utilisateur ?{" "}
                <a
                  href="/register"
                  style={{ textDecoration: "underline", cursor: "pointer" }}
                >
                  Créer une agence ou un compte simple
                </a>
              </p>
            </div>

            <div
              style={{
                marginTop: 14,
                borderTop: "1px solid rgba(148,163,184,0.35)",
                paddingTop: 8,
                fontSize: "0.75rem",
                opacity: 0.8,
              }}
            >
              🔐 Connexion sécurisée.  
              Les propriétaires d’agences gèrent uniquement leurs annonces, et
              le Super Admin garde la vision globale de la plateforme.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
