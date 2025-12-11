"use client";

import { useEffect, useState } from "react";

const INITIAL_FORM = {
  title: "",
  description: "",
  city: "",
  country: "",
  price: "",
  currency: "EUR",
  type: "vente",
  agencyId: "",
  imageUrls: ""
};

export default function AnnoncesPage() {
  const [listings, setListings] = useState([]);
  const [agences, setAgences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      const [resListings, resAgencies] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/agencies")
      ]);

      if (!resListings.ok) throw new Error("Erreur API listings");
      if (!resAgencies.ok) throw new Error("Erreur API agencies");

      const [dataListings, dataAgencies] = await Promise.all([
        resListings.json(),
        resAgencies.json()
      ]);

      setListings(dataListings);
      setAgences(dataAgencies);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les annonces / agences");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const imageUrlsArray = form.imageUrls
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          imageUrls: imageUrlsArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de l’ajout de l’annonce");
      }

      setForm(INITIAL_FORM);
      await fetchData();
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors de l’ajout de l’annonce");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h1 className="page-title">Annonces</h1>
          <p className="page-subtitle">
            Liste d’annonces reliées aux agences (PostgreSQL via Supabase & Prisma).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "8px",
            marginBottom: "12px"
          }}
        >
          <input
            type="text"
            placeholder="Titre *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
            type="number"
            placeholder="Prix *"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="MAD">MAD</option>
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="vente">Vente</option>
            <option value="location">Location</option>
            <option value="terrain">Terrain</option>
          </select>
          <select
            value={form.agencyId}
            onChange={(e) => setForm({ ...form, agencyId: e.target.value })}
            required
          >
            <option value="">Agence *</option>
            {agences.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.city})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="URLs images (séparées par des virgules)"
            value={form.imageUrls}
            onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={{ gridColumn: "1 / -1", minHeight: 60 }}
          />

          <button
            type="submit"
            className="btn-outline"
            disabled={saving}
            style={{ alignSelf: "center", marginTop: "4px" }}
          >
            {saving ? "Enregistrement..." : "Ajouter l’annonce"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#fecaca", fontSize: "0.8rem", marginBottom: 8 }}>
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ fontSize: "0.8rem" }}>Chargement des annonces...</p>
        ) : listings.length === 0 ? (
          <p style={{ fontSize: "0.8rem" }}>
            Aucune annonce pour le moment. Ajoute une annonce ci-dessus.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Ville</th>
                  <th>Pays</th>
                  <th>Agence</th>
                  <th>Type</th>
                  <th>Prix</th>
                  <th>Devise</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td>{l.title}</td>
                    <td>{l.city}</td>
                    <td>{l.country}</td>
                    <td>{l.agency?.name || "—"}</td>
                    <td>{l.type}</td>
                    <td>{l.price}</td>
                    <td>{l.currency}</td>
                    <td>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
