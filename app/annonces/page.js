"use client";

import { useEffect, useState } from "react";

const INITIAL_FORM = {
  title: "",
  description: "",
  city: "",
  country: "",
  price: "",
  currency: "EUR",
  status: "ACTIVE",
  type: "",
  agencyId: "",
  imageUrlsText: "", // URLs manuelles
};

const STATUS_LABELS = {
  ACTIVE: "Active",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivée",
};

// 🔹 Format de date FR (jj/mm/aaaa)
function formatDateFr(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AnnoncesPage() {
  const [agencies, setAgencies] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [createFiles, setCreateFiles] = useState([]); // fichiers uploadés (create)

  const [filterAgencyId, setFilterAgencyId] = useState("ALL");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editFiles, setEditFiles] = useState([]); // fichiers uploadés (edit)

  // 🧍 Utilisateur courant
  const [me, setMe] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 🖼️ Lightbox (galerie images)
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryListing, setGalleryListing] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const isSuperAdmin = me?.role === "SUPER_ADMIN";

  // --- Utils ---
  function parseImageUrls(text) {
    return String(text || "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }

  // Charger agences
  async function fetchAgencies() {
    try {
      const res = await fetch("/api/agencies");
      if (!res.ok) throw new Error("Erreur API agences");
      const data = await res.json();
      console.log("👉 API /api/agencies →", data);
      setAgencies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les agences");
    }
  }

  // Charger annonces (filtre agence)
  async function fetchListings(agencyId = filterAgencyId) {
    try {
      setLoading(true);
      setError("");

      let params = "";
      if (agencyId && agencyId !== "ALL") {
        params = `?agencyId=${agencyId}`;
      }

      const res = await fetch(`/api/listings${params}`);
      if (!res.ok) throw new Error("Erreur API annonces");
      const data = await res.json();
      console.log("👉 API /api/listings →", data);
      setListings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les annonces");
    } finally {
      setLoading(false);
    }
  }

  // Initialisation : user + agences + annonces
  useEffect(() => {
    async function init() {
      try {
        // 1) Récupérer l'utilisateur connecté
        try {
          const resMe = await fetch("/api/auth/me", {
            method: "GET",
            cache: "no-store",
          });
          if (resMe.ok) {
            const data = await resMe.json().catch(() => null);
            const u = data?.user || data || null;
            setMe(u);

            // Si ce n'est PAS un SUPER_ADMIN -> on force le filtre sur son agence
            if (u?.role !== "SUPER_ADMIN" && u?.agencyId) {
              setFilterAgencyId(u.agencyId);
              await fetchAgencies();
              await fetchListings(u.agencyId);
              setAuthChecked(true);
              // On pré-remplit agencyId pour le formulaire
              setForm((prev) => ({
                ...prev,
                agencyId: u.agencyId,
              }));
              return;
            }
          } else {
            setMe(null);
          }
        } catch (e) {
          console.error("Erreur auth /api/auth/me :", e);
          setMe(null);
        }

        // 2) Cas SUPER_ADMIN ou pas d'utilisateur → toutes les agences / annonces
        await fetchAgencies();
        await fetchListings("ALL");
      } finally {
        setAuthChecked(true);
      }
    }

    init();
  }, []);

  function handleFilterAgencyChange(e) {
    const value = e.target.value;
    // ⚠️ On ne permet de changer le filtre que pour SUPER_ADMIN
    if (!isSuperAdmin) return;
    setFilterAgencyId(value);
    fetchListings(value);
  }

  // --- CREATE ---
  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // 1) Upload des fichiers sur Supabase Storage
      let uploadedUrls = [];
      if (createFiles.length > 0) {
        const fd = new FormData();
        createFiles.forEach((file) => fd.append("files", file));

        const uploadRes = await fetch("/api/uploads/listing-images", {
          method: "POST",
          body: fd,
        });

        let uploadData = null;
        try {
          uploadData = await uploadRes.json();
        } catch {
          console.error(
            "❌ Réponse non JSON de /api/uploads/listing-images"
          );
          throw new Error(
            "Réponse invalide du serveur lors de l’upload des images."
          );
        }

        console.log(
          "👉 Réponse /api/uploads/listing-images (status",
          uploadRes.status,
          ") →",
          uploadData
        );

        if (!uploadRes.ok) {
          throw new Error(
            uploadData?.error || "Erreur lors de l’upload des images"
          );
        }
        uploadedUrls = uploadData.urls || [];
      }

      // 2) URLs tapées manuellement
      const manualUrls = parseImageUrls(form.imageUrlsText);

      // 3) Toutes les URLs
      const imageUrls = [...manualUrls, ...uploadedUrls];

      const payload = {
        title: form.title,
        description: form.description,
        city: form.city,
        country: form.country,
        price: form.price,
        currency: form.currency,
        status: form.status,
        type: form.type,
        // ⚠️ Un non SUPER_ADMIN n'a qu'une agence : son agencyId
        agencyId: isSuperAdmin ? form.agencyId : me?.agencyId,
        imageUrls,
      };

      console.log("👉 Payload POST /api/listings →", payload);

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      console.log(
        "👉 Réponse POST /api/listings (status",
        res.status,
        ") →",
        data
      );

      if (!res.ok) throw new Error(data?.error || "Erreur lors de l’ajout");

      setForm((prev) => ({
        ...INITIAL_FORM,
        // on garde agencyId forcé pour le propriétaire
        agencyId: isSuperAdmin ? "" : me?.agencyId || "",
      }));
      setCreateFiles([]);
      await fetchListings(isSuperAdmin ? filterAgencyId : me?.agencyId);
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors de l’ajout de l’annonce");
    } finally {
      setSaving(false);
    }
  }

  // --- ÉDITION ---
  function startEdit(listing) {
    setEditingId(listing.id);

    const imageUrlsText = Array.isArray(listing.images)
      ? listing.images.map((img) => img.url).join("\n")
      : "";

    setEditForm({
      title: listing.title || "",
      description: listing.description || "",
      city: listing.city || "",
      country: listing.country || "",
      price: String(listing.price ?? ""),
      currency: listing.currency || "EUR",
      status: listing.status || "ACTIVE",
      type: listing.type || "",
      agencyId: listing.agencyId || "",
      imageUrlsText,
    });
    setEditFiles([]);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(INITIAL_FORM);
    setEditFiles([]);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;

    setEditSaving(true);
    setError("");

    try {
      // Upload des nouvelles images éventuelles
      let uploadedEditUrls = [];
      if (editFiles.length > 0) {
        const fd = new FormData();
        editFiles.forEach((file) => fd.append("files", file));

        const uploadRes = await fetch("/api/uploads/listing-images", {
          method: "POST",
          body: fd,
        });

        let uploadData = null;
        try {
          uploadData = await uploadRes.json();
        } catch {
          console.error(
            "❌ Réponse non JSON de /api/uploads/listing-images (edit)"
          );
          throw new Error(
            "Réponse invalide du serveur lors de l’upload des nouvelles images."
          );
        }

        console.log(
          "👉 Réponse /api/uploads/listing-images (EDIT, status",
          uploadRes.status,
          ") →",
          uploadData
        );

        if (!uploadRes.ok) {
          throw new Error(
            uploadData?.error || "Erreur lors de l’upload des nouvelles images"
          );
        }
        uploadedEditUrls = uploadData.urls || [];
      }

      // URLs existantes dans le textarea
      const manualUrls = parseImageUrls(editForm.imageUrlsText);

      // Toutes les URLs
      const imageUrls = [...manualUrls, ...uploadedEditUrls];

      const payload = {
        title: editForm.title,
        description: editForm.description,
        city: editForm.city,
        country: editForm.country,
        price: editForm.price,
        currency: editForm.currency,
        status: editForm.status,
        type: editForm.type,
        agencyId: isSuperAdmin ? editForm.agencyId : me?.agencyId,
        imageUrls,
      };

      console.log("👉 Payload PUT /api/listings/:id →", payload);

      const res = await fetch(`/api/listings/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      console.log(
        "👉 Réponse PUT /api/listings/:id (status",
        res.status,
        ") →",
        data
      );

      if (!res.ok)
        throw new Error(data?.error || "Erreur lors de la mise à jour");

      setEditingId(null);
      setEditForm(INITIAL_FORM);
      setEditFiles([]);
      await fetchListings(isSuperAdmin ? filterAgencyId : me?.agencyId);
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors de la mise à jour de l’annonce");
    } finally {
      setEditSaving(false);
    }
  }

  // --- DELETE ---
  async function handleDelete(id) {
    const ok = window.confirm(
      "Supprimer définitivement cette annonce ?"
    );
    if (!ok) return;

    setError("");

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      console.log(
        "👉 Réponse DELETE /api/listings/:id (status",
        res.status,
        ") →",
        data
      );

      if (!res.ok)
        throw new Error(data?.error || "Erreur lors de la suppression");

      await fetchListings(isSuperAdmin ? filterAgencyId : me?.agencyId);
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors de la suppression de l’annonce");
    }
  }

  // --- LIGHTBOX / GALERIE ---
  function openGallery(listing, index = 0) {
    if (!listing || !Array.isArray(listing.images) || listing.images.length === 0) return;
    setGalleryListing(listing);
    setGalleryIndex(index);
    setGalleryOpen(true);
  }

  function closeGallery() {
    setGalleryOpen(false);
    setGalleryListing(null);
    setGalleryIndex(0);
  }

  function nextImage() {
    if (!galleryListing || !Array.isArray(galleryListing.images)) return;
    const total = galleryListing.images.length;
    setGalleryIndex((prev) => (prev + 1) % total);
  }

  function prevImage() {
    if (!galleryListing || !Array.isArray(galleryListing.images)) return;
    const total = galleryListing.images.length;
    setGalleryIndex((prev) => (prev - 1 + total) % total);
  }

  // 🔎 Filtrage côté front : un propriétaire ne voit que ses annonces
  const filteredListings =
    isSuperAdmin || !me?.agencyId
      ? listings
      : listings.filter((l) => l.agencyId === me.agencyId);

  const totalFiltered = filteredListings.length;

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <h1 className="page-title">Annonces immobilières</h1>
          <p className="page-subtitle">
            Création, gestion et filtrage des annonces par agence, avec upload
            multi-images sur Supabase Storage.
          </p>
        </div>

        {/* FILTRE AGENCE */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {isSuperAdmin ? (
              <>
                <span style={{ fontSize: "0.8rem" }}>
                  Filtrer par agence :
                </span>
                <select
                  value={filterAgencyId}
                  onChange={handleFilterAgencyChange}
                  style={{ minWidth: 180 }}
                >
                  <option value="ALL">🌍 Toutes les agences</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.city}, {a.country})
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <span style={{ fontSize: "0.8rem" }}>
                Vos annonces —{" "}
                {me?.agencyId
                  ? agencies.find((a) => a.id === me.agencyId)?.name ||
                    "Votre agence"
                  : "Aucune agence associée"}
              </span>
            )}
          </div>

          <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>
            Total annonces : {totalFiltered}
          </div>
        </div>

        {/* FORMULAIRE CREATION */}
        <form
          onSubmit={handleCreate}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <input
            type="text"
            placeholder="Titre de l’annonce *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Type (Appartement, Villa, Terrain...) *"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
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
          <input
            type="text"
            placeholder="Devise (EUR, MAD...)"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Brouillon</option>
            <option value="ARCHIVED">Archivée</option>
          </select>

          {isSuperAdmin ? (
            <select
              value={form.agencyId}
              onChange={(e) =>
                setForm({ ...form, agencyId: e.target.value })
              }
              required
            >
              <option value="">Choisir une agence *</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.city})
                </option>
              ))}
            </select>
          ) : (
            me?.agencyId && (
              <input
                type="text"
                readOnly
                value={
                  agencies.find((a) => a.id === me.agencyId)?.name ||
                  "Votre agence"
                }
                style={{
                  opacity: 0.85,
                  cursor: "not-allowed",
                }}
              />
            )
          )}

          {/* Upload fichiers (CREATE) */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                marginBottom: 4,
                opacity: 0.85,
              }}
            >
              Images (upload) :
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setCreateFiles(Array.from(e.target.files || []))
              }
            />
            {createFiles.length > 0 && (
              <p style={{ fontSize: "0.75rem", marginTop: 4, opacity: 0.8 }}>
                {createFiles.length} image(s) sélectionnée(s) pour upload.
              </p>
            )}
          </div>

          {/* URLs manuelles (optionnel) */}
          <textarea
            placeholder="URLs des images (une URL par ligne, en plus de l’upload)"
            value={form.imageUrlsText}
            onChange={(e) =>
              setForm({ ...form, imageUrlsText: e.target.value })
            }
            style={{ gridColumn: "1 / -1" }}
          />

          <textarea
            placeholder="Description (optionnel)"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={{ gridColumn: "1 / -1" }}
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
          <p
            style={{
              color: "#fecaca",
              fontSize: "0.8rem",
              marginBottom: 8,
            }}
          >
            {error}
          </p>
        )}

        {/* TABLE LISTE ANNONCES */}
        {loading ? (
          <p style={{ fontSize: "0.8rem" }}>Chargement des annonces...</p>
        ) : totalFiltered === 0 ? (
          <p style={{ fontSize: "0.8rem" }}>
            Aucune annonce pour le moment. Ajoute une annonce ou change le
            filtre d’agence.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Agence</th>
                  <th>Ville</th>
                  <th>Pays</th>
                  <th>Prix</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Ajoutée le</th> {/* 🔹 NOUVELLE COLONNE */}
                  <th>Images</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((l) =>
                  editingId === l.id ? (
                    // LIGNE EDIT
                    <tr key={l.id}>
                      <td>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              title: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        {isSuperAdmin ? (
                          <select
                            value={editForm.agencyId}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                agencyId: e.target.value,
                              })
                            }
                          >
                            <option value="">Choisir une agence</option>
                            {agencies.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            readOnly
                            value={
                              agencies.find(
                                (a) => a.id === l.agencyId
                              )?.name || "Votre agence"
                            }
                            style={{
                              opacity: 0.85,
                              cursor: "not-allowed",
                            }}
                          />
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              city: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.country}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              country: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editForm.type}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              type: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              status: e.target.value,
                            })
                          }
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="DRAFT">Brouillon</option>
                          <option value="ARCHIVED">Archivée</option>
                        </select>
                      </td>
                      {/* Colonne date en mode édition : read-only */}
                      <td>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                          {l.createdAt ? formatDateFr(l.createdAt) : "—"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <textarea
                            placeholder="URLs des images (une par ligne)"
                            value={editForm.imageUrlsText}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                imageUrlsText: e.target.value,
                              })
                            }
                            style={{ minWidth: 180, minHeight: 60 }}
                          />
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) =>
                              setEditFiles(
                                Array.from(e.target.files || [])
                              )
                            }
                          />
                          {editFiles.length > 0 && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                opacity: 0.8,
                              }}
                            >
                              {editFiles.length} nouvelle(s) image(s) sera(ont)
                              ajoutée(s).
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn-outline"
                            type="button"
                            onClick={handleUpdate}
                            disabled={editSaving}
                          >
                            {editSaving ? "..." : "Enregistrer"}
                          </button>
                          <button
                            className="btn-outline"
                            type="button"
                            onClick={cancelEdit}
                          >
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // LIGNE LECTURE
                    <tr key={l.id}>
                      <td>{l.title}</td>
                      <td>{l.agency?.name || "—"}</td>
                      <td>{l.city}</td>
                      <td>{l.country}</td>
                      <td>
                        {typeof l.price === "number"
                          ? `${l.price.toLocaleString("fr-FR")} ${
                              l.currency || ""
                            }`
                          : "—"}
                      </td>
                      <td>{l.type}</td>
                      <td>{STATUS_LABELS[l.status] || l.status}</td>
                      <td>
                        <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                          {l.createdAt ? formatDateFr(l.createdAt) : "—"}
                        </span>
                      </td>
                      <td>
                        {Array.isArray(l.images) && l.images.length > 0 ? (
                          <button
                            type="button"
                            className="image-thumb-btn"
                            onClick={() => openGallery(l, 0)}
                          >
                            <img
                              src={l.images[0].url}
                              alt="Aperçu"
                              style={{
                                width: 48,
                                height: 48,
                                objectFit: "cover",
                                borderRadius: 8,
                                border:
                                  "1px solid rgba(148,163,184,0.4)",
                              }}
                            />
                            {l.images.length > 1 && (
                              <span style={{ fontSize: "0.75rem" }}>
                                +{l.images.length - 1} autres
                              </span>
                            )}
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                            Aucune
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="btn-outline"
                            type="button"
                            onClick={() => startEdit(l)}
                          >
                            Modifier
                          </button>
                          <button
                            className="btn-outline"
                            type="button"
                            onClick={() => handleDelete(l.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 🖼️ LIGHTBOX / GALERIE MODALE */}
      {galleryOpen &&
        galleryListing &&
        Array.isArray(galleryListing.images) &&
        galleryListing.images.length > 0 && (
          <div className="lightbox-backdrop" onClick={closeGallery}>
            <div
              className="lightbox-container"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryListing.images[galleryIndex].url}
                alt="Annonce"
                className="lightbox-image"
              />
              <div className="lightbox-info">
                <div className="lightbox-title">
                  {galleryListing.title} — {galleryIndex + 1}/
                  {galleryListing.images.length}
                </div>
                {galleryListing.createdAt && (
                  <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                    Ajoutée le {formatDateFr(galleryListing.createdAt)}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="lightbox-close"
                onClick={closeGallery}
              >
                ✕
              </button>
              {galleryListing.images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="lightbox-nav lightbox-prev"
                    onClick={prevImage}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="lightbox-nav lightbox-next"
                    onClick={nextImage}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
