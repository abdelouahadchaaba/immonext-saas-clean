"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "🏠", title: "Dashboard" },
  { href: "/agences", label: "🏢", title: "Agences" },
  { href: "/annonces", label: "📋", title: "Annonces" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null); // ✅ on stocke le user

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          setIsAuth(false);
          setUser(null);
        } else {
          const data = await res.json().catch(() => null);
          const u = data?.user || data || null;
          setUser(u);
          setIsAuth(true);
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

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      // on ignore les erreurs réseau ici
    } finally {
      setIsAuth(false);
      setUser(null);
      router.push("/login");
    }
  }

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo" title="ImmoNext">
        IN
      </div>

      {/* Liens principaux */}
      <div className="nav-links">
        {links
          .filter((link) => {
            // ⚠️ La page /agences est réservée au SUPER_ADMIN
            if (link.href === "/agences") {
              return isSuperAdmin;
            }
            return true;
          })
          .map((link) => (
            <Link key={link.href} href={link.href} title={link.title}>
              <button
                className={
                  "nav-link" + (pathname === link.href ? " active" : "")
                }
              >
                <span>{link.label}</span>
              </button>
            </Link>
          ))}
      </div>

      {/* Zone bas : admin, login / logout + paramètres */}
      <div className="nav-footer">
        {/* Bouton admin visible seulement pour SUPER_ADMIN */}
        {isSuperAdmin && (
          <Link href="/admin/agences" title="Administration des agences">
            <button
              className={
                "nav-link" +
                (pathname === "/admin/agences" ? " active" : "")
              }
            >
              ⭐
            </button>
          </Link>
        )}

        {/* Tant qu’on n’a pas encore vérifié l’auth, on ne montre rien de spécial */}
        {authChecked && (
          <>
            {!isAuth ? (
              // Pas connecté → bouton Login
              <Link href="/login" title="Se connecter">
                <button className="nav-link">🔑</button>
              </Link>
            ) : (
              // Connecté → bouton Logout
              <button
                className="nav-link"
                title="Se déconnecter"
                onClick={handleLogout}
              >
                🚪
              </button>
            )}
          </>
        )}

        {/* Bouton paramètres qui reste toujours */}
        <button className="nav-link" title="Paramètres">
          ⚙️
        </button>
      </div>
    </nav>
  );
}
