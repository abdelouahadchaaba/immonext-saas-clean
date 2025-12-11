"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Si déjà connecté → on redirige vers le dashboard
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        if (res.ok) {
          router.push("/");
          return;
        }
      } catch (e) {
        // on ignore, l'utilisateur n'est simplement pas connecté
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

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

      // Connexion OK → direction dashboard
      router.push("/");
    } catch (err) {
      setError(err.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="page">
        <section className="panel">
          <p style={{ fontSize: "0.9rem" }}>Vérification de la session...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h1 className="page-title">Connexion</h1>
          <p className="page-subtitle">
            Connecte-toi pour accéder à ta plateforme ImmoNext (agence & annonces).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: "380px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "12px",
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
            <p style={{ color: "#fecaca", fontSize: "0.8rem" }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-outline"
            disabled={loading}
            style={{ marginTop: "4px" }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p
          style={{
            marginTop: "10px",
            fontSize: "0.8rem",
            opacity: 0.8,
          }}
        >
          Pas encore de compte ?{" "}
          <a
            href="/register"
            style={{ textDecoration: "underline", cursor: "pointer" }}
          >
            Créer une agence
          </a>
        </p>
      </section>
    </div>
  );
}
