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

      // après connexion → on va vers les annonces
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
    <div className="home-page">
      <div className="home-grid">
        {/* COLONNE GAUCHE : texte marketing + boutons */}
        <section className="home-hero">
          <div className="home-badge">
            <span className="home-badge-dot" />
            Plateforme SaaS multi-agences immobilières
          </div>

          <h1 className="home-hero-title">
            ImmoNext – la nouvelle génération de{" "}
            <span className="home-hero-highlight">
              SaaS pour les agences immobilières.
            </span>
          </h1>

          <p className="home-hero-subtitle">
            Centralise tes agences, tes annonces et toutes tes photos dans une
            seule plateforme. ImmoNext est pensée pour les réseaux immobiliers,
            les agences indépendantes et les investisseurs partout dans le
            monde (PostgreSQL + Prisma + Supabase + Next.js).
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

          {/* Boutons d’action */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {/* Tout le monde peut voir la vitrine */}
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

            {/* Non connecté → boutons register + login */}
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

            {/* Connecté + agence → accès direct annonces */}
            {authChecked && me && hasAgency && (
              <Link href="/annonces">
                <button className="btn-outline">📋 Gérer mes annonces</button>
              </Link>
            )}

            {/* Connecté sans agence → CTA devenir agence */}
            {authChecked && me && !hasAgency && (
              <Link href="/register">
                <button className="btn-outline">
                  🏢 Devenir agence partenaire
                </button>
              </Link>
            )}

            {/* Super admin → gestion agences */}
            {authChecked && isSuperAdmin && (
              <Link href="/agences">
                <button className="btn-outline">🌐 Gérer les agences</button>
              </Link>
            )}
          </div>

          {/* Petites stats / avantages */}
          <div className="home-stats-row">
            <div className="home-stat-card">
              <div className="home-stat-number">🌍</div>
              <div className="home-stat-label">
                Multi-agences, multi-pays, multi-utilisateurs.
              </div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-number">📸</div>
              <div className="home-stat-label">
                Galeries photos avec slider auto + manuel.
              </div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-number">☁️</div>
              <div className="home-stat-label">
                Stockage sécurisé via Supabase Storage.
              </div>
            </div>
          </div>
        </section>

        {/* COLONNE DROITE : carte de login */}
        <section className="hero-card home-login-card">
          <h2 className="hero-title">Connexion à ImmoNext</h2>
          <p className="hero-subtitle">
            Connecte-toi pour gérer tes annonces (si tu es une agence) ou pour
            explorer la vitrine immobilière mondiale.
          </p>

          <form
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "8px",
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

          <p
            style={{
              marginTop: 6,
              fontSize: "0.75rem",
              opacity: 0.8,
            }}
          >
            Tu peux aussi simplement te connecter sans agence et visiter la{" "}
            <a
              href="/galerie"
              style={{ textDecoration: "underline", cursor: "pointer" }}
            >
              vitrine des annonces
            </a>
            .
          </p>

          <div
            style={{
              marginTop: 10,
              borderTop: "1px solid rgba(148,163,184,0.35)",
              paddingTop: 8,
              fontSize: "0.75rem",
              opacity: 0.8,
            }}
          >
            🔐 Les propriétaires d’agences voient uniquement leurs annonces.
            Le Super Admin garde la vision globale de toutes les agences.
          </div>
        </section>
      </div>
    </div>
  );
}
