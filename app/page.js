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

      // ⬇️ IMPORTANT : on regarde le user renvoyé par l’API
      const u = data?.user || data || null;

      // SUPER_ADMIN ou utilisateur qui a une agence -> accès à /annonces (mais filtré par son agence)
      if (u?.role === "SUPER_ADMIN" || u?.agencyId) {
        router.push("/annonces");
      } else {
        // ✅ utilisateur SANS agence -> il ne voit que la vitrine
        router.push("/galerie");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la connexion");
    } finally {
      setLoggingIn(false);
    }
  }

  const hasAgency = !!me?.agencyId;
  const isSuperAdmin = me?.role === "SUPER_ADMIN";

  return (
    <div className="page" style={{ maxWidth: "100%", paddingTop: 0 }}>
      {/* BARRE DU HAUT façon ANAXAGO */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 32px",
          marginBottom: 12,
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.35)",
          background: "rgba(2,6,23,0.95)",
        }}
      >
        {/* Logo simple pour l’instant */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            IN
          </div>
          <span>IMMONEXT</span>
        </div>

        {/* Menu central (juste du texte) */}
        <nav
          style={{
            display: "flex",
            gap: 24,
            fontSize: "0.9rem",
            opacity: 0.9,
          }}
        >
         
         
        </nav>

        {/* Actions à droite */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {authChecked && me ? (
            <Link href={hasAgency || isSuperAdmin ? "/annonces" : "/galerie"}>
              <button className="btn-outline">Mon espace</button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button
                  className="btn-outline"
                  style={{
                    paddingInline: 16,
                    background: "transparent",
                  }}
                >
                  Se connecter
                </button>
              </Link>
              <Link href="/register">
                <button
                  className="btn-outline"
                  style={{
                    paddingInline: 18,
                    background: "#2563eb",
                    borderColor: "#2563eb",
                    color: "#f9fafb",
                    fontWeight: 600,
                  }}
                >
                  Créer un compte
                </button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* HERO PRINCIPAL */}
      <section
        className="panel"
        style={{
          padding: "64px 24px 32px",
          textAlign: "center",
          maxWidth: "100%",
        }}
      >
        <p
          style={{
            fontSize: "0.85rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#a5b4fc",
            marginBottom: 12,
          }}
        >
          Plateforme SaaS d&apos;investissement immobilier
        </p>

        <h1
          style={{
            fontSize: "clamp(2.4rem, 4vw, 3.2rem)",
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Plateforme d&apos;investissement en{" "}
          <span style={{ fontStyle: "italic" }}>immobilier</span> et{" "}
          <span style={{ fontStyle: "italic" }}>innovation</span>
        </h1>

        <p
          style={{
            maxWidth: 720,
            margin: "0 auto",
            fontSize: "0.98rem",
            opacity: 0.9,
            marginBottom: 28,
          }}
        >
          ImmoNext connecte les agences immobilières, les investisseurs et les
          porteurs de projets dans une seule plateforme mondiale : annonces
          photo, vitrine publique, gestion des équipes & des villes.
        </p>

        {/* Gros boutons centraux */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 14,
            marginBottom: 32,
          }}
        >
          <Link href={hasAgency || isSuperAdmin ? "/annonces" : "/register"}>
            <button
              className="btn-outline"
              style={{
                paddingInline: 26,
                paddingBlock: 12,
                borderRadius: 999,
                fontSize: "0.98rem",
                fontWeight: 600,
                background: "#f9fafb",
                color: "#020617",
                borderColor: "#f9fafb",
              }}
            >
              Créer mon compte agence
            </button>
          </Link>

          <Link href="/galerie">
            <button
              className="btn-outline"
              style={{
                paddingInline: 26,
                paddingBlock: 12,
                borderRadius: 999,
                fontSize: "0.98rem",
                fontWeight: 500,
                background: "transparent",
              }}
            >
              Découvrir les annonces
            </button>
          </Link>
        </div>

        {/* Bandeau d’infos */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 10,
            fontSize: "0.8rem",
            textAlign: "left",
          }}
        >
          <div>
            <div style={{ opacity: 0.75 }}>Multi-pays</div>
            <div style={{ fontWeight: 600 }}>Réseaux d&apos;agences</div>
          </div>
          <div>
            <div style={{ opacity: 0.75 }}>Vitrine photo</div>
            <div style={{ fontWeight: 600 }}>Galerie publique & slider</div>
          </div>
          <div>
            <div style={{ opacity: 0.75 }}>Sécurité</div>
            <div style={{ fontWeight: 600 }}>
              Rôles Super Admin / agence / visiteur
            </div>
          </div>
        </div>
      </section>

      {/* SECTION CONNEXION RAPIDE */}
      {!me && (
        <section
          className="panel"
          style={{
            maxWidth: 480,
            margin: "18px auto 0",
          }}
        >
          <h2
            className="hero-title"
            style={{ fontSize: "1.3rem", textAlign: "center" }}
          >
            Connexion rapide
          </h2>
          <p
            className="hero-subtitle"
            style={{ fontSize: "0.9rem", textAlign: "center", marginBottom: 12 }}
          >
            Accède à ton espace ImmoNext pour gérer tes annonces ou suivre les
            opportunités.
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
              textAlign: "center",
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
        </section>
      )}
    </div>
  );
}
