"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Pas de baseLinks fixes : on construit le menu selon le rôle
export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json().catch(() => null);
          const u = data?.user || data || null;
          setIsAuth(true);
          setUser(u);
        } else {
          setIsAuth(false);
          setUser(null);
        }
      } catch {
        setIsAuth(false);
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    } finally {
      setIsAuth(false);
      setUser(null);
      router.push("/login");
    }
  }

  // =========
  // 🔐 LOGIQUE DE MENU
  // =========
  const links = [];

  // 1️⃣ Tout le monde (connecté ou non) : VITRINE
  links.push({
    href: "/galerie",
    label: "🖼️",
    title: "Vitrine publique des annonces",
  });

  // 2️⃣ Utilisateur connecté avec agence OU SUPER_ADMIN : accès Dashboard + Annonces
  const hasAgency = !!user?.agencyId;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  if (isSuperAdmin || hasAgency) {
    // Dashboard
    links.unshift({
      href: "/",
      label: "🏠",
      title: "Tableau de bord",
    });

    // Annonces (gestion)
    links.push({
      href: "/annonces",
      label: "📋",
      title: "Annonces",
    });
  }

  // 3️⃣ Gestion des agences → UNIQUEMENT SUPER_ADMIN
  if (isSuperAdmin) {
    links.push(
      {
        href: "/agences",
        label: "🏢",
        title: "Gestion des agences",
      },
      {
        href: "/admin/agences",
        label: "🌍",
        title: "Admin – Toutes les agences du monde",
      }
    );
  }

  // =========
  // RENDU
  // =========
  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo" title="ImmoNext">
        IN
      </div>

      {/* Liens dynamiques suivant rôle / agence */}
      <div className="nav-links">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href.startsWith("/admin") && pathname.startsWith("/admin"));

          return (
            <Link key={link.href} href={link.href} title={link.title}>
              <button className={"nav-link" + (isActive ? " active" : "")}>
                <span>{link.label}</span>
              </button>
            </Link>
          );
        })}
      </div>

      {/* Bas de la NavBar : login / register / logout + paramètres */}
      <div className="nav-footer">
        {authChecked && (
          <>
            {!isAuth ? (
              <>
                {/* Bouton Login */}
                <Link href="/login" title="Se connecter">
                  <button className="nav-link">🔑</button>
                </Link>
                {/* Bouton Register (créer compte / agence) */}
                <Link href="/register" title="Créer un compte">
                  <button className="nav-link">➕</button>
                </Link>
              </>
            ) : (
              <>
                {/* Bouton Logout */}
                <button
                  className="nav-link"
                  title="Se déconnecter"
                  onClick={handleLogout}
                >
                  🚪
                </button>
              </>
            )}
          </>
        )}

        {/* Bouton paramètres (visible pour tout le monde) */}
        <button className="nav-link" title="Paramètres">
          ⚙️
        </button>
      </div>
    </nav>
  );
}
