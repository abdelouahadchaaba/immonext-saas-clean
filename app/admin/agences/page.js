"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAgencesPage() {
  const router = useRouter();

  const [agencies, setAgencies] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function checkAuthAndLoad() {
    try {
      // 1) Vérifier l'utilisateur connecté
      const resMe = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      if (!resMe.ok) {
        // pas connecté → login
        router.push("/login");
        return;
      }

      const me = await resMe.json();

      // 2) Vérifier le rôle
      if (me.role !== "SUPER_ADMIN") {
        // pas le droit → redirection vers dashboard
        router.push("/");
        return;
      }

      // 3) Charger toutes les agences (API retourne déjà tout pour SUPER_ADMIN)
      setAuthChecked(true);
      setLoading(true);

      const resAgencies = await fetch("/api/agencies", {
        method: "GET",
        cache: "no-store",
      });

      if (!resAgencies.ok) {
        const data = await resAgencies.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur API agences");
      }

      const data = await resAgencies.json();
      setAgencies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors du chargement des agences");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authChecked && loading) {
    return (
      <div className="page">
        <section className="panel">
          <p style={{ fontSize: "0.9rem" }}>Vérification des droits...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h1 className="page-title">Admin – Toutes les agences</h1>
          <p className="page-subtitle">
            Vue globale des agences immobilières dans la plateforme ImmoNext
            (réservée au SUPER_ADMIN).
          </p>
        </div>

        {error && (
          <p style={{ color: "#fecaca", fontSize: "0.8rem", marginBottom: 8 }}>
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ fontSize: "0.8rem" }}>Chargement des agences...</p>
        ) : agencies.length === 0 ? (
          <p style={{ fontSize: "0.8rem" }}>
            Aucune agence trouvée pour le moment.
          </p>
        ) : (
          <div
            style={{
              marginTop: "12px",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid rgba(148, 163, 184, 0.3)",
                  }}
                >
                  <th style={{ padding: "6px 4px" }}>Nom</th>
                  <th style={{ padding: "6px 4px" }}>Ville / Pays</th>
                  <th style={{ padding: "6px 4px" }}>Email</th>
                  <th style={{ padding: "6px 4px" }}>Téléphone</th>
                  <th style={{ padding: "6px 4px" }}>Plan</th>
                  <th style={{ padding: "6px 4px" }}>Statut</th>
                  <th style={{ padding: "6px 4px" }}>Créée le</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => {
                  const created =
                    a.createdAt &&
                    new Date(a.createdAt).toLocaleDateString("fr-FR");

                  return (
                    <tr
                      key={a.id}
                      style={{
                        borderBottom:
                          "1px solid rgba(30, 64, 175, 0.15)",
                      }}
                    >
                      <td style={{ padding: "6px 4px", fontWeight: 600 }}>
                        {a.name}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {a.city} — {a.country}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                          {a.email || <span style={{ opacity: 0.6 }}>—</span>}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {a.phone || <span style={{ opacity: 0.6 }}>—</span>}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {a.plan || "FREE"}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {a.isActive ? "✅ Active" : "⛔️ Suspendue"}
                      </td>
                      <td style={{ padding: "6px 4px" }}>
                        {created || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
