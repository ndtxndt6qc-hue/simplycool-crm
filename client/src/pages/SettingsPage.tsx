import { useEffect, useState, type FormEvent } from "react";
import { useSettings, useUpdateSettings, useUploadLogo, useUploadVorlage, useTestSmtp } from "../lib/settings";
import { UsersSection } from "../components/UsersSection";
import { ApiError } from "../lib/api";

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadLogo = useUploadLogo();
  const uploadAbnahmeVorlage = useUploadVorlage("abnahmeprotokoll");
  const uploadInstallVorlage = useUploadVorlage("installationsanweisung");
  const testSmtp = useTestSmtp();

  const [firmenname, setFirmenname] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [iban, setIban] = useState("");
  const [qrIban, setQrIban] = useState("");
  const [mwstNummer, setMwstNummer] = useState("");
  const [defaultMwstSatz, setDefaultMwstSatz] = useState("8.10");
  const [stundensatz, setStundensatz] = useState("0");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpAbsenderEmail, setSmtpAbsenderEmail] = useState("");
  const [adminBenachrichtigungEmail, setAdminBenachrichtigungEmail] = useState("");
  const [terminDauerMinuten, setTerminDauerMinuten] = useState("60");
  const [garantieZeit, setGarantieZeit] = useState("");
  const [angebotSperreNachVersand, setAngebotSperreNachVersand] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!settings) return;
    setFirmenname(settings.firmenname ?? "");
    setStrasse(settings.strasse ?? "");
    setPlz(settings.plz ?? "");
    setOrt(settings.ort ?? "");
    setIban(settings.iban ?? "");
    setQrIban(settings.qrIban ?? "");
    setMwstNummer(settings.mwstNummer ?? "");
    setDefaultMwstSatz(settings.defaultMwstSatz ?? "8.10");
    setStundensatz(settings.stundensatz ?? "0");
    setSmtpHost(settings.smtpHost ?? "");
    setSmtpPort(settings.smtpPort ? String(settings.smtpPort) : "587");
    setSmtpUser(settings.smtpUser ?? "");
    setSmtpAbsenderEmail(settings.smtpAbsenderEmail ?? "");
    setAdminBenachrichtigungEmail(settings.adminBenachrichtigungEmail ?? "");
    setTerminDauerMinuten(String(settings.terminDauerMinuten ?? 60));
    setGarantieZeit(settings.garantieZeit ?? "");
    setAngebotSperreNachVersand(settings.angebotSperreNachVersand ?? true);
  }, [settings]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    try {
      await updateSettings.mutateAsync({
        firmenname,
        strasse,
        plz,
        ort,
        iban,
        qrIban,
        mwstNummer,
        defaultMwstSatz: Number(defaultMwstSatz),
        stundensatz: Number(stundensatz),
        smtpHost,
        smtpPort: smtpPort ? Number(smtpPort) : undefined,
        smtpUser,
        smtpAbsenderEmail,
        adminBenachrichtigungEmail,
        terminDauerMinuten: Number(terminDauerMinuten),
        garantieZeit,
        angebotSperreNachVersand,
        ...(smtpPass ? { smtpPassEncrypted: smtpPass } : {}),
      });
      setSmtpPass("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Speichern fehlgeschlagen.");
    }
  }

  async function handleTestSmtp() {
    setSmtpTestResult(null);
    if (!smtpHost.trim() || !smtpUser.trim()) {
      setSmtpTestResult({ ok: false, message: "Bitte mindestens SMTP-Host und Benutzer eintragen." });
      return;
    }
    try {
      const result = await testSmtp.mutateAsync({
        smtpHost,
        smtpPort: smtpPort ? Number(smtpPort) : 587,
        smtpUser,
        smtpAbsenderEmail,
        adminBenachrichtigungEmail,
        ...(smtpPass ? { smtpPassEncrypted: smtpPass } : {}),
      });
      setSmtpTestResult({
        ok: true,
        message: result.testMailGesendetAn
          ? `Verbindung erfolgreich — Test-E-Mail an ${result.testMailGesendetAn} gesendet.`
          : "Verbindung erfolgreich. Keine Test-E-Mail gesendet, da keine Admin-E-Mail hinterlegt ist.",
      });
    } catch (err) {
      setSmtpTestResult({ ok: false, message: err instanceof ApiError ? err.message : "Test fehlgeschlagen." });
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadLogo.mutateAsync(file);
    e.target.value = "";
  }

  if (isLoading) return <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Einstellungen</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Firma</h3>
          <div className="field">
            <label htmlFor="s-firmenname">Firmenname</label>
            <input id="s-firmenname" value={firmenname} onChange={(e) => setFirmenname(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-logo">Logo</label>
            {settings?.logoPfad && (
              <img src={settings.logoPfad} alt="Firmenlogo" style={{ maxHeight: 60, marginBottom: 8 }} />
            )}
            <input id="s-logo" type="file" accept="image/*" onChange={handleLogoChange} />
          </div>
          <div className="field">
            <label htmlFor="s-strasse">Strasse</label>
            <input id="s-strasse" value={strasse} onChange={(e) => setStrasse(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="s-plz">PLZ</label>
              <input id="s-plz" value={plz} onChange={(e) => setPlz(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label htmlFor="s-ort">Ort</label>
              <input id="s-ort" value={ort} onChange={(e) => setOrt(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-mwst-nummer">MWST-Nummer</label>
            <input id="s-mwst-nummer" value={mwstNummer} onChange={(e) => setMwstNummer(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Zahlung (Swiss QR-Rechnung)</h3>
          <div className="field">
            <label htmlFor="s-iban">IBAN</label>
            <input id="s-iban" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="CH00 0000 0000 0000 0000 0" />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
              Schweizer IBAN, 21 Zeichen (CH + 2 Prüfziffern + 17 Ziffern).
            </p>
          </div>
          <div className="field">
            <label htmlFor="s-qr-iban">QR-IBAN (falls abweichend)</label>
            <input id="s-qr-iban" value={qrIban} onChange={(e) => setQrIban(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Kalkulation</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="s-mwst">Standard-MWST-Satz (%)</label>
              <input id="s-mwst" type="number" step="0.01" value={defaultMwstSatz} onChange={(e) => setDefaultMwstSatz(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="s-stundensatz">Interner Stundensatz (CHF)</label>
              <input id="s-stundensatz" type="number" step="0.01" value={stundensatz} onChange={(e) => setStundensatz(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-garantie">Garantiezeit (z.B. "24 Monate")</label>
            <input id="s-garantie" value={garantieZeit} onChange={(e) => setGarantieZeit(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Angebote</h3>
          <div className="field" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              id="s-angebot-sperre"
              type="checkbox"
              checked={angebotSperreNachVersand}
              onChange={(e) => setAngebotSperreNachVersand(e.target.checked)}
            />
            <label htmlFor="s-angebot-sperre" style={{ margin: 0 }}>
              Angebot nach Versand automatisch sperren (nicht mehr bearbeitbar)
            </label>
          </div>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
            Nach Annahme durch den Kunden ist ein Angebot immer gesperrt, unabhängig von dieser Einstellung.
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Checkliste & Protokoll-Vorlagen</h3>
          <div className="field">
            <label htmlFor="s-vorlage-abnahme">Vorlage Abnahmeprotokoll (PDF/Word)</label>
            {settings?.abnahmeprotokollVorlagePfad && (
              <p style={{ margin: "0 0 8px" }}>
                <a href={settings.abnahmeprotokollVorlagePfad} target="_blank" rel="noreferrer">
                  Aktuelle Vorlage ansehen
                </a>
              </p>
            )}
            <input
              id="s-vorlage-abnahme"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await uploadAbnahmeVorlage.mutateAsync(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="s-vorlage-install">Vorlage Installationsanweisung/-protokoll (PDF/Word)</label>
            {settings?.installationsanweisungVorlagePfad && (
              <p style={{ margin: "0 0 8px" }}>
                <a href={settings.installationsanweisungVorlagePfad} target="_blank" rel="noreferrer">
                  Aktuelle Vorlage ansehen
                </a>
              </p>
            )}
            <input
              id="s-vorlage-install"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await uploadInstallVorlage.mutateAsync(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>E-Mail-Versand (SMTP)</h3>
          <div className="field">
            <label htmlFor="s-smtp-host">SMTP-Host</label>
            <input id="s-smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-smtp-port">Port</label>
            <input id="s-smtp-port" type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-smtp-user">Benutzer</label>
            <input id="s-smtp-user" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-smtp-pass">Passwort {settings?.smtpPassSet && "(gesetzt — leer lassen um zu behalten)"}</label>
            <input id="s-smtp-pass" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-smtp-absender">Absender-E-Mail</label>
            <input
              id="s-smtp-absender"
              type="email"
              value={smtpAbsenderEmail}
              onChange={(e) => setSmtpAbsenderEmail(e.target.value)}
              placeholder="z.B. info@simply-cool.ch"
            />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
              Adresse, die als Absender in versendeten E-Mails erscheint. Muss beim E-Mail-Anbieter (z.B. Brevo)
              als Absender verifiziert sein — ist meist NICHT dasselbe wie der SMTP-Benutzer oben. Leer lassen,
              um den SMTP-Benutzer als Absender zu verwenden.
            </p>
          </div>
          <div className="field">
            <label htmlFor="s-admin-email">Admin-E-Mail für neue Website-Leads</label>
            <input
              id="s-admin-email"
              type="email"
              value={adminBenachrichtigungEmail}
              onChange={(e) => setAdminBenachrichtigungEmail(e.target.value)}
              placeholder="z.B. info@simply-cool.ch"
            />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
              Bei jeder neuen Anfrage über das Kontaktformular oder Terminbuchung der Webseite wird an diese
              Adresse eine Benachrichtigung gesendet (nur wenn SMTP oben konfiguriert ist).
            </p>
          </div>

          <button type="button" className="btn btn-secondary" onClick={handleTestSmtp} disabled={testSmtp.isPending}>
            {testSmtp.isPending ? "Testet…" : "Verbindung testen"}
          </button>
          {smtpTestResult && (
            <p
              style={{
                fontSize: 12,
                marginTop: 8,
                color: smtpTestResult.ok ? "var(--color-success, #16a34a)" : "var(--color-danger)",
              }}
            >
              {smtpTestResult.message}
            </p>
          )}
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "8px 0 0" }}>
            Testet die oben eingetragenen Werte direkt (auch ungespeichert) — prüft Verbindung/Login und sendet,
            falls eine Admin-E-Mail hinterlegt ist, eine Test-E-Mail dorthin.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Terminbuchung</h3>
          <div className="field">
            <label htmlFor="s-termin-dauer">Termindauer (Minuten)</label>
            <input
              id="s-termin-dauer"
              type="number"
              min={15}
              step={15}
              value={terminDauerMinuten}
              onChange={(e) => setTerminDauerMinuten(e.target.value)}
            />
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
              Länge eines buchbaren Termins auf der Webseite. Verfügbare Zeitfenster werden unter{" "}
              <a href="/app/termine">Terminkalender</a> verwaltet.
            </p>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        {saved && <p style={{ color: "var(--color-success)" }}>Gespeichert.</p>}
        <button type="submit" className="btn btn-primary" disabled={updateSettings.isPending} style={{ alignSelf: "flex-start" }}>
          {updateSettings.isPending ? "Speichern…" : "Speichern"}
        </button>
      </form>

      <div style={{ maxWidth: 560, marginTop: 20 }}>
        <UsersSection />
      </div>
    </div>
  );
}
