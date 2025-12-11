"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_FORM = {
  name: "",
  city: "",
  country: "",
  email: "",
  phone: "",
};

export default function AgencesPage() {
  const router = useRouter();

  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const [me, setMe] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false); // 🔥 accès autorisé (SUPER_ADMIN)

  // Charger l'utilisateur courant
  useEffect(() => {
    async function loadAuth() {
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
      } catch (e) {
        console.error("Erreur /api/auth/me :", e);
        setMe(null);
      } finally {
        setAuthChecked(true);
      }
    }

    loadAuth();
  }, []);

  // Dès qu'on connaît l'auth → décider quoi faire
  useEffect(() => {
    if (!authChecked) return;

    // 1) Pas connecté → login
    if (!me) {
      router.replace("/login");
      return;
    }

    // 2) Connecté mais pas SUPER_ADMIN → vitrine
    if (me.role !== "SUPER_ADMIN") {
      router.replace("/galerie");
      return;
    }

    // 3) SUPER_ADMIN → accès autorisé
    setAllowed(true);
  }, [authChecked, me, router]);

  async function fetchAgencies() {
    try {
      setLoading(true);
      const res = await fetch("/api/agencies");
      if (!res.ok) throw new Error("Erreur API agences");
      const data = await res.json();
      setAgences(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les agences");
    } finally {
      setLoading(false);
    }
  }

  // Charger les agences seulement quand l'accès est autorisé
  useEffect(() => {
    if (!allowed) return;
    fetchAgencies();
  }, [allowed]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur lors de l’ajout");
      setForm(INITIAL_FORM);
      await fetchAgencies();
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors de l’ajout de l’agence");
    } finally {
      setSaving(false);
    }
  }

  // 1) On ne sait pas encore si on a le droit
  if (!authChecked || !allowed) {
    return (
      <div className="page">
        <section className="panel">
          <div className="panel-header">
            <h1 className="page-title">Agences</h1>
          </div>
          <p style={{ fontSize: "0.85rem" }}>Vérification des droits...</p>
        </section>
      </div>
    );
  }

  // 2) SUPER_ADMIN → page complète
  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h1 className="page-title">Agences</h1>
          <p className="page-subtitle">
            Gestion des agences immobilières connectées à la plateforme
            (réservé à l’administrateur).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Nom de l’agence *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Ville *"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Pays *"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Téléphone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <button
            type="submit"
            className="btn-outline"
            disabled={saving}
            style={{ alignSelf: "center", marginTop: "4px" }}
          >
            {saving ? "Enregistrement..." : "Ajouter l’agence"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#fecaca", fontSize: "0.8rem", marginBottom: 8 }}>
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ fontSize: "0.8rem" }}>Chargement des agences...</p>
        ) : agences.length === 0 ? (
          <p style={{ fontSize: "0.8rem" }}>
            Aucune agence pour le moment. Ajoute ta première agence ci-dessus.
          </p>
        ) : (
          <div className="cards-row">
            {agences.map((a) => (
              <div className="agency-card" key={a.id}>
                <h2>{a.name}</h2>
                <p className="agency-city">
                  {a.city} — {a.country}
                </p>
                {a.email && <p className="agency-email">{a.email}</p>}
                {a.phone && (
                  <p style={{ fontSize: "0.8rem", marginBottom: "6px" }}>
                    📞 {a.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
