import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useBranding, PUBLIC_LOGO_URL } from "../../lib/publicApi";
import { PageTextsProvider, useKontaktInfo } from "../../lib/pageTexts";
import "../../public/public.css";
import "../publicV2.css";

const NAV_ITEMS = [
  { to: "/v2", label: "Startseite", end: true },
  { to: "/v2/leistungen", label: "Leistungen" },
  { to: "/v2/referenzen", label: "Referenzen" },
  { to: "/v2/ueber-uns", label: "Über uns" },
  { to: "/v2/kontakt", label: "Kontakt" },
];

export function PublicLayoutV2() {
  return (
    <PageTextsProvider>
      <PublicLayoutV2Inner />
    </PageTextsProvider>
  );
}

function PublicLayoutV2Inner() {
  const { data: branding } = useBranding();
  const { telefon, telefonHref, email, einsatzgebiet } = useKontaktInfo();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="pv2 public-site">
      <header className="pv2-header">
        <div className="pv2-header-inner">
          <Link to="/v2" className="pv2-brand">
            {branding?.hatLogo ? (
              <img src={PUBLIC_LOGO_URL} alt={branding.firmenname} className="pv2-brand-logo" />
            ) : (
              <span>{branding?.firmenname || "SimplyCool"}</span>
            )}
          </Link>
          <button
            type="button"
            className="pv2-nav-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Menü schliessen" : "Menü öffnen"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <nav className={`pv2-nav${menuOpen ? " open" : ""}`}>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link to="/v2/kontakt" className="pv2-nav-cta">
              Anfrage stellen
            </Link>
          </nav>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="pv2-footer">
        <div className="pv2-footer-inner">
          <div>
            <strong>{branding?.firmenname || "SimplyCool"}</strong>
            <p>{einsatzgebiet}</p>
            <p>
              <a href={telefonHref}>{telefon}</a>
              <br />
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          </div>
          <div className="pv2-footer-links">
            <Link to="/v2/impressum">Impressum</Link>
            <Link to="/v2/datenschutz">Datenschutzerklärung</Link>
          </div>
        </div>
        <div className="pv2-footer-copyright">
          © {new Date().getFullYear()} {branding?.firmenname || "SimplyCool"} — Design-Entwurf V2
        </div>
      </footer>
    </div>
  );
}
