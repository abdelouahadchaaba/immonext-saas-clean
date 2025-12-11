"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        throw new Error(data?.error || "Login échoué");
      }

      router.push("/"); // redirection après login
    } catch (err) {
      setError(err.message || "Erreur lors du login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h1 className="page-title">Connexion</h1>
          <p className="page-subtitle">
            Connecte-toi pour accéder à la plateforme ImmoNext (agences & annonces).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p style={{ color: "#fecaca", fontSize: "0.8rem" }}>{error}</p>
          )}

          <button type="submit" className="btn-outline" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </section>
    </div>
  );
}
