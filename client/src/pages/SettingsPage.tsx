import { useEffect, useState, type FormEvent } from "react";
import { useSettings, useUpdateSettings, useUploadLogo } from "../lib/settings";

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const uploadLogo = useUploadLogo();

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
  const [saved, setSaved] = useState(false);

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
  }, [settings]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
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
      ...(smtpPass ? { smtpPassEncrypted: smtpPass } : {}),
    });
    setSmtpPass("");
    setSaved(true);
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
        </div>

        {saved && <p style={{ color: "var(--color-success)" }}>Gespeichert.</p>}
        <button type="submit" className="btn btn-primary" disabled={updateSettings.isPending} style={{ alignSelf: "flex-start" }}>
          {updateSettings.isPending ? "Speichern…" : "Speichern"}
        </button>
      </form>
    </div>
  );
}
