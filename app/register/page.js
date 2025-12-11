"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [accountType, setAccountType] = useState("AGENCY_OWNER"); // "AGENCY_OWNER" | "USER_ONLY"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Champs agence (uniquement si propriétaire d’agence)
  const [agencyName, setAgencyName] = useState("");
  const [agencyCity, setAgencyCity] = useState("");
  const [agencyCountry, setAgencyCountry] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email et mot de passe sont obligatoires.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (accountType === "AGENCY_OWNER") {
      if (!agencyName || !agencyCity || !agencyCountry) {
        setError(
          "Pour un compte agence, le nom, la ville et le pays de l’agence sont obligatoires."
        );
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        email,
        password,
        accountType, // "AGENCY_OWNER" ou "USER_ONLY"
        agency:
          accountType === "AGENCY_OWNER"
            ? {
                name: agencyName,
                city: agencyCity,
                country: agencyCountry,
                phone: agencyPhone,
              }
            : null,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      console.log("👉 Réponse /api/auth/register →", res.status, data);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Erreur lors de la création du compte. Vérifie les informations."
        );
      }

      setSuccess("Compte créé avec succès. Tu peux maintenant te connecter.");
      // On nettoie le formulaire
      setPassword("");
      setPasswordConfirm("");

      // Redirection logique :
      // - propriétaire agence → login (puis ira sur /annonces)
      // - user simple → login (puis ira sur /galerie)
      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur inconnue lors de l’inscription.");
    } finally {
      setLoading(false);
    }
  }

  const isAgencyOwner = accountType === "AGENCY_OWNER";

  return (
    <div className="root-main">
      <div className="hero-card">
        <h1 className="hero-title">Créer un compte ImmoNext</h1>
        <p className="hero-subtitle">
          Choisis ton type de compte : propriétaire d’agence ou simple
          utilisateur qui explore les annonces.
        </p>

        {/* Choix du type de compte */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn-outline"
            onClick={() => setAccountType("AGENCY_OWNER")}
            style={{
              background:
                accountType === "AGENCY_OWNER"
                  ? "linear-gradient(135deg,#4f46e5,#22c55e)"
                  : undefined,
              color: accountType === "AGENCY_OWNER" ? "#020617" : undefined,
            }}
          >
            🏢 Propriétaire d’agence
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setAccountType("USER_ONLY")}
            style={{
              background:
                accountType === "USER_ONLY"
                  ? "linear-gradient(135deg,#06b6d4,#22c55e)"
                  : undefined,
              color: accountType === "USER_ONLY" ? "#020617" : undefined,
            }}
          >
            👤 Utilisateur simple
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "10px",
          }}
        >
          {/* Email & mot de passe */}
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

          <input
            type="password"
            placeholder="Confirme le mot de passe *"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />

          {/* Champs agence si propriétaire */}
          {isAgencyOwner && (
            <>
              <hr
                style={{
                  borderColor: "rgba(148,163,184,0.4)",
                  margin: "6px 0",
                }}
              />
              <p
                style={{
                  fontSize: "0.8rem",
                  opacity: 0.85,
                  marginBottom: 4,
                }}
              >
                Informations de l’agence :
              </p>

              <input
                type="text"
                placeholder="Nom de l’agence *"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                required={isAgencyOwner}
              />
              <input
                type="text"
                placeholder="Ville *"
                value={agencyCity}
                onChange={(e) => setAgencyCity(e.target.value)}
                required={isAgencyOwner}
              />
              <input
                type="text"
                placeholder="Pays *"
                value={agencyCountry}
                onChange={(e) => setAgencyCountry(e.target.value)}
                required={isAgencyOwner}
              />
              <input
                type="text"
                placeholder="Téléphone (optionnel)"
                value={agencyPhone}
                onChange={(e) => setAgencyPhone(e.target.value)}
              />
            </>
          )}

          <button
            type="submit"
            className="btn-outline"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        {error && (
          <p
            style={{
              marginTop: 10,
              color: "#fecaca",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            style={{
              marginTop: 10,
              color: "#bbf7d0",
              fontSize: "0.85rem",
            }}
          >
            {success}
          </p>
        )}

        <p
          style={{
            marginTop: 16,
            fontSize: "0.8rem",
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          Tu as déjà un compte ?{" "}
          <a
            href="/login"
            style={{ color: "#60a5fa", textDecoration: "none" }}
          >
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
