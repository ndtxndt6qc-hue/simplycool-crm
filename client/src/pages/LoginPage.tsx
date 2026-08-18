import { useState, type FormEvent } from "react";
import { useAuth, ApiError } from "../lib/auth";
import { useBranding } from "../lib/branding";

export function LoginPage() {
  const { login, setup, setupRequired } = useAuth();
  const { data: branding } = useBranding();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (setupRequired) {
        await setup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        {branding?.logoDataUri ? (
          <img src={branding.logoDataUri} alt={branding.firmenname} style={{ height: 40, marginBottom: 12 }} />
        ) : (
          <h2 style={{ marginBottom: 4 }}>{branding?.firmenname || "SimplyCool"}</h2>
        )}
        <p style={{ color: "var(--color-text-muted)", marginTop: 0, marginBottom: 24 }}>
          {setupRequired ? "Ersten Benutzer einrichten" : "Anmelden"}
        </p>

        {setupRequired && (
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">E-Mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={setupRequired ? "new-password" : "current-password"}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Bitte warten…" : setupRequired ? "Einrichten" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}
