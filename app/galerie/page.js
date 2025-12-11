"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_LABELS = {
  ACTIVE: "Active",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivée",
};

// 🔹 Format date FR jj/mm/aaaa
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

export default function GaleriePage() {
  const [me, setMe] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🖼️ Lightbox
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryListing, setGalleryListing] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // 🔍 Filtres simples
  const [searchText, setSearchText] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortMode, setSortMode] = useState("DATE_DESC"); // DATE_DESC, PRICE_ASC, PRICE_DESC

  // Charger l'utilisateur connecté
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
      } catch (e) {
        console.error("Erreur /api/auth/me :", e);
        setMe(null);
      } finally {
        setAuthChecked(true);
      }
    }

    loadMe();
  }, []);

  // Charger les annonces (toutes puis filtrage ACTIVE côté front)
  async function fetchListings() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/listings");
      if (!res.ok) throw new Error("Erreur API annonces");
      const data = await res.json();
      console.log("👉 API /api/listings (galerie) →", data);

      const arr = Array.isArray(data) ? data : [];
      // On ne garde que les annonces ACTIVE
      const active = arr.filter((l) => l.status === "ACTIVE");
      setListings(active);
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les annonces pour la galerie");
    } finally {
      setLoading(false);
    }
  }

  // Quand l'auth est connue et qu'on est connecté → charger les annonces
  useEffect(() => {
    if (!authChecked) return;
    if (!me) return; // pas connecté, on ne lance pas l'appel
    fetchListings();
  }, [authChecked, me]);

  // --- Lightbox ---
  function openGallery(listing, index = 0) {
    if (!listing || !Array.isArray(listing.images) || listing.images.length === 0)
      return;
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

  // 🎞️ Auto-slide dans la lightbox (toutes les 4s)
  useEffect(() => {
    if (!galleryOpen || !galleryListing || !Array.isArray(galleryListing.images)) {
      return;
    }
    if (galleryListing.images.length <= 1) return;

    const id = setInterval(() => {
      setGalleryIndex((prev) => {
        const total = galleryListing.images.length;
        return (prev + 1) % total;
      });
    }, 4000);

    return () => clearInterval(id);
  }, [galleryOpen, galleryListing]);

  // --- Filtres / tri côté front ---
  const filteredListings = listings
    .filter((l) => {
      // filtre texte (titre, ville, pays, type)
      const txt = searchText.trim().toLowerCase();
      if (txt) {
        const haystack = (
          (l.title || "") +
          " " +
          (l.city || "") +
          " " +
          (l.country || "") +
          " " +
          (l.type || "")
        )
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const needle = txt
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (!haystack.includes(needle)) return false;
      }

      // filtre ville
      if (cityFilter !== "ALL" && l.city !== cityFilter) return false;

      // filtre type
      if (typeFilter !== "ALL" && l.type !== typeFilter) return false;

      // filtre prix min/max
      const p = typeof l.price === "number" ? l.price : null;
      if (p !== null) {
        if (minPrice !== "" && p < Number(minPrice)) return false;
        if (maxPrice !== "" && p > Number(maxPrice)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortMode === "PRICE_ASC") {
        const pa = typeof a.price === "number" ? a.price : Infinity;
        const pb = typeof b.price === "number" ? b.price : Infinity;
        return pa - pb;
      }
      if (sortMode === "PRICE_DESC") {
        const pa = typeof a.price === "number" ? a.price : -Infinity;
        const pb = typeof b.price === "number" ? b.price : -Infinity;
        return pb - pa;
      }
      // DATE_DESC (par défaut) → plus récent d'abord
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

  const hasResults = filteredListings.length > 0;

  // 1) On ne sait pas encore si l'utilisateur est connecté
  if (!authChecked) {
    return (
      <div className="page page-public">
        <section className="panel">
          <div className="panel-header">
            <h1 className="page-title">Vitrine ImmoNext</h1>
          </div>
          <p style={{ fontSize: "0.85rem" }}>Chargement...</p>
        </section>
      </div>
    );
  }

  // 2) Utilisateur non connecté → message + lien login
  if (!me) {
    return (
      <div className="page page-public">
        <section className="panel">
          <div className="panel-header">
            <h1 className="page-title">Vitrine ImmoNext</h1>
            <p className="page-subtitle">
              Connecte-toi pour voir toutes les annonces avec photos.
            </p>
          </div>
          <p style={{ fontSize: "0.85rem", marginBottom: 12 }}>
            Cette page est accessible à tout utilisateur inscrit (même sans
            agence), via email et mot de passe.
          </p>
          <Link href="/login">
            <button className="btn-outline">Se connecter</button>
          </Link>
        </section>
      </div>
    );
  }

  // 3) Utilisateur connecté → on affiche la galerie
  return (
    <div className="page page-public">
      <section className="panel">
        <div className="panel-header">
          <h1 className="page-title">Vitrine des annonces</h1>
          <p className="page-subtitle">
            Toutes les annonces actives, avec photos, prix, date d’ajout et
            coordonnées des agences.
          </p>
        </div>

        {/* 🔍 Barre de filtres */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 8,
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Recherche (titre, ville, type...)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {/* Ville (à partir des annonces) */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="ALL">Toutes les villes</option>
            {Array.from(new Set(listings.map((l) => l.city).filter(Boolean))).map(
              (city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              )
            )}
          </select>

          {/* Type (Appartement, Villa...) */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Tous les types</option>
            {Array.from(new Set(listings.map((l) => l.type).filter(Boolean))).map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              )
            )}
          </select>

          {/* Prix min / max */}
          <input
            type="number"
            placeholder="Prix min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Prix max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          {/* Tri */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="DATE_DESC">Plus récentes d’abord</option>
            <option value="PRICE_ASC">Prix croissant</option>
            <option value="PRICE_DESC">Prix décroissant</option>
          </select>
        </div>

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

        {loading ? (
          <p style={{ fontSize: "0.85rem" }}>Chargement des annonces...</p>
        ) : !hasResults ? (
          <p style={{ fontSize: "0.85rem" }}>
            Aucune annonce ne correspond à vos filtres.
          </p>
        ) : (
          <div className="cards-row gallery-layout">
            {filteredListings.map((l) => {
              const hasImages =
                Array.isArray(l.images) && l.images.length > 0;
              const mainImage = hasImages ? l.images[0].url : null;
              const agencyName = l.agency?.name || "Agence non renseignée";
              const agencyPhone = l.agency?.phone || "";
              const agencyEmail = l.agency?.email || "";

              return (
                <div className="stat-card gallery-card" key={l.id}>
                  {/* Image */}
                  <button
                    type="button"
                    className="image-thumb-btn"
                    onClick={() => hasImages && openGallery(l, 0)}
                  >
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={l.title}
                        style={{
                          display: "block",
                          width: "100%",
                          height: 160,
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="image-thumb-empty">Aucune image</div>
                    )}
                  </button>

                  {/* Titre + localisation */}
                  <h2 style={{ fontSize: "0.95rem", marginBottom: 4 }}>
                    {l.title}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#93c5fd",
                      marginBottom: 4,
                    }}
                  >
                    {l.city}, {l.country} —{" "}
                    <span style={{ opacity: 0.8 }}>{l.type}</span>
                  </p>

                  {/* Prix */}
                  <p
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {typeof l.price === "number"
                      ? `${l.price.toLocaleString("fr-FR")} ${
                          l.currency || ""
                        }`
                      : "Prix non renseigné"}
                  </p>

                  {/* 🔹 Date d’ajout */}
                  <p
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.85,
                      marginBottom: 6,
                    }}
                  >
                    Ajoutée le{" "}
                    {l.createdAt ? formatDateFr(l.createdAt) : "—"}
                  </p>

                  {/* Statut (pour info) */}
                  <p
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.8,
                      marginBottom: 6,
                    }}
                  >
                    Statut : {STATUS_LABELS[l.status] || l.status}
                  </p>

                  {/* Agence + contact */}
                  <div
                    style={{
                      fontSize: "0.78rem",
                      marginTop: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <div>
                      🏢 <strong>{agencyName}</strong>
                    </div>
                    {agencyPhone && (
                      <div>
                        📞{" "}
                        <a
                          href={`tel:${agencyPhone}`}
                          style={{ color: "#bfdbfe", textDecoration: "none" }}
                        >
                          {agencyPhone}
                        </a>
                      </div>
                    )}
                    {agencyEmail && (
                      <div>
                        ✉️{" "}
                        <a
                          href={`mailto:${agencyEmail}`}
                          style={{ color: "#bfdbfe", textDecoration: "none" }}
                        >
                          {agencyEmail}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Si plusieurs images, petit texte */}
                  {hasImages && l.images.length > 1 && (
                    <p
                      style={{
                        fontSize: "0.7rem",
                        opacity: 0.75,
                        marginTop: 6,
                      }}
                    >
                      {l.images.length} photo(s) — clique sur l’image pour
                      ouvrir la galerie.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 🖼️ LIGHTBOX (modale plein écran) */}
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
