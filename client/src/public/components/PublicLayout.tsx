import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useBranding, PUBLIC_LOGO_URL } from "../../lib/publicApi";
import { PageTextsProvider, useKontaktInfo } from "../../lib/pageTexts";
import "../public.css";

const NAV_ITEMS = [
  { to: "/", label: "Startseite", end: true },
  { to: "/leistungen", label: "Leistungen" },
  { to: "/referenzen", label: "Referenzen" },
  { to: "/ueber-uns", label: "Über uns" },
  { to: "/termin", label: "Termin buchen" },
  { to: "/kontakt", label: "Kontakt" },
];

export function PublicLayout() {
  return (
    <PageTextsProvider>
      <PublicLayoutInner />
    </PageTextsProvider>
  );
}

function PublicLayoutInner() {
  const { data: branding } = useBranding();
  const { telefon, telefonHref, email, einsatzgebiet } = useKontaktInfo();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="public-site">
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand">
            {branding?.hatLogo ? (
              <img src={PUBLIC_LOGO_URL} alt={branding.firmenname} className="public-brand-logo" />
            ) : (
              <span>{branding?.firmenname || "SimplyCool"}</span>
            )}
          </Link>
          <button
            type="button"
            className="public-nav-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menü schliessen" : "Menü öffnen"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <nav className={`public-nav${menuOpen ? " open" : ""}`}>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link to="/kontakt" className="public-cta-btn">
              Anfrage stellen
            </Link>
          </nav>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div>
            <strong>{branding?.firmenname || "SimplyCool"}</strong>
            <p>{einsatzgebiet}</p>
            <p>
              <a href={telefonHref}>{telefon}</a>
              <br />
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          </div>
          <div className="public-footer-links">
            <Link to="/impressum">Impressum</Link>
            <Link to="/datenschutz">Datenschutzerklärung</Link>
            <Link to="/agb">AGB</Link>
          </div>
        </div>
        <div className="public-footer-copyright">
          © {new Date().getFullYear()} {branding?.firmenname || "SimplyCool"}
        </div>
      </footer>
    </div>
  );
}
