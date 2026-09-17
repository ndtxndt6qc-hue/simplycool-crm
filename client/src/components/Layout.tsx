import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useSettings } from "../lib/settings";

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/leads", label: "Leads" },
  { to: "/app/kunden", label: "Kunden" },
  { to: "/app/geraete", label: "Geräte & Lager" },
  { to: "/app/angebote", label: "Angebote" },
  { to: "/app/auftraege", label: "Aufträge" },
  { to: "/app/rechnungen", label: "Rechnungen" },
  { to: "/app/gemeinde-anforderungen", label: "Gemeinde-Anforderungen" },
  { to: "/app/webseite-texte", label: "Webseiten-Texte" },
  { to: "/app/einstellungen", label: "Einstellungen" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { data: settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="app-nav-brand">
          {settings?.logoPfad ? (
            <img src={settings.logoPfad} alt={settings.firmenname} style={{ height: 44, display: "block" }} />
          ) : (
            "SimplyCool"
          )}
        </div>
        <button
          type="button"
          className="app-nav-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Menü schliessen" : "Menü öffnen"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
        <div className={`app-nav-menu${menuOpen ? " open" : ""}`}>
          <ul className="app-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="app-nav-footer">
            <div className="app-nav-user">{user?.name}</div>
            <button className="btn btn-secondary" onClick={() => logout()}>
              Abmelden
            </button>
          </div>
        </div>
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
