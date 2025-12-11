"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  agencyName: "",
  city: "",
  country: "",
  phone: "",
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // Si déjà connecté → on redirige vers dashboard
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
        // pas connecté = normal
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password,
        name: form.name || form.agencyName,
        agencyName: form.agencyName,
        city: form.city,
        country: form.country,
        phone: form.phone || undefined,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Échec de la création du compte");
      }

      // Inscription OK → l’API a déjà posé le cookie auth → direction dashboard
      router.push("/");
    } catch (err) {
      setError(err.message || "Erreur lors de la création du compte");
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
          <h1 className="page-title">Créer une agence</h1>
          <p className="page-subtitle">
            Crée ton compte ImmoNext et enregistre ta première agence
            immobilière dans la plateforme.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginTop: "12px",
          }}
        >
          {/* Bloc utilisateur */}
          <input
            type="text"
            placeholder="Nom complet (utilisateur)"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <input
            type="email"
            placeholder="Email de connexion *"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Mot de passe *"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmer le mot de passe *"
            value={form.confirmPassword}
            onChange={(e) =>
              handleChange("confirmPassword", e.target.value)
            }
            required
          />

          {/* Bloc agence */}
          <input
            type="text"
            placeholder="Nom de l’agence *"
            value={form.agencyName}
            onChange={(e) => handleChange("agencyName", e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Ville de l’agence *"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Pays de l’agence *"
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Téléphone de l’agence"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />

          <button
            type="submit"
            className="btn-outline"
            disabled={loading}
            style={{ marginTop: "4px" }}
          >
            {loading ? "Création en cours..." : "Créer mon compte & agence"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#fecaca", fontSize: "0.8rem", marginTop: "8px" }}>
            {error}
          </p>
        )}

        <p
          style={{
            marginTop: "10px",
            fontSize: "0.8rem",
            opacity: 0.8,
          }}
        >
          Tu as déjà un compte ?{" "}
          <a
            href="/login"
            style={{ textDecoration: "underline", cursor: "pointer" }}
          >
            Se connecter
          </a>
        </p>
      </section>
    </div>
  );
}
