# Deployment auf Hetzner

Diese Datei beschreibt, wie SimplyCool (öffentliche Webseite + interne App) auf einem
eigenen Hetzner-VPS unter `simply-cool.ch` betrieben wird. Alle hier beschriebenen Schritte
sind **vorbereitet, aber nicht automatisch ausgeführt** — du triggerst das Deployment bewusst
selbst.

Alle Docker-Konfigurationen (`docker-compose.yml`, `server/Dockerfile`, `client/Dockerfile`,
`Caddyfile`) wurden lokal in einem Container-Testlauf gebaut und end-to-end durchgetestet
(Postgres-Verbindung, Migration, PDF-Erstellung mit Puppeteer, Routing über Caddy, SPA-Fallback).

## 1. Server

- **Empfohlen:** Hetzner CX22 (2 vCPU, 4 GB RAM, 40 GB SSD) — reicht für Postgres + Node-Server
  + den Vite-Build beim Deployment locker aus. Bei spürbarer Last (viele parallele PDF-Erstellungen)
  später auf CX32 hochskalieren.
- **Image:** Ubuntu 24.04 LTS
- Docker + Docker Compose Plugin installieren:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- Einen dedizierten, nicht-root SSH-Deploy-Benutzer anlegen und zur `docker`-Gruppe hinzufügen
  (für den GitHub-Actions-Workflow, siehe unten):
  ```bash
  adduser deploy
  usermod -aG docker deploy
  ```

## 2. DNS

Bei simply-cool.ch (Registrar-Einstellungen):
- `A`-Record `@` → IP-Adresse des Hetzner-Servers
- `CNAME`-Record `www` → `simply-cool.ch`

Caddy bezieht das SSL-Zertifikat erst automatisch, sobald diese Records aufgelöst werden und
Port 80/443 vom Server aus erreichbar sind.

## 3. Projekt auf den Server holen

```bash
su - deploy
git clone https://github.com/<dein-repo>/simplycool-crm.git /opt/simplycool-crm
cd /opt/simplycool-crm
cp .env.production.example .env
# .env mit echten Werten befüllen (siehe Abschnitt 6)
```

## 4. Docker-Compose-Setup

`docker-compose.yml` im Projekt-Root startet vier Services:

| Service    | Zweck                                                              |
|------------|---------------------------------------------------------------------|
| `postgres` | Datenbank, Daten liegen in einem benannten Volume (`postgres_data`) |
| `server`   | Express-API (Node, läuft via `tsx`, siehe Hinweis unten)             |
| `client`   | Statischer Vite-Build, ausgeliefert über nginx                      |
| `caddy`    | Reverse-Proxy + automatisches Let's-Encrypt-SSL für `simply-cool.ch` |

Caddy routet `/api/*` und `/uploads/*` auf den `server`-Container, alles andere auf den
`client`-Container (`Caddyfile` im Projekt-Root).

Hochgeladene Dateien (Logo, Referenz-Fotos, Protokolle etc.) landen in `server/uploads/` und
werden über ein eigenes Docker-Volume (`uploads_data`) persistiert — bleiben also auch bei
einem Deployment/Container-Neustart erhalten.

Erststart:

```bash
docker compose up -d --build
docker compose exec -T server npm run db:migrate
docker compose exec -T server npm run db:seed   # optional: Beispiel-Gemeinden AG
```

### Hinweis zum Server-Build

`server/package.json` hat zwar ein `"start": "node dist/index.js"`-Skript, das ist aber
aktuell **nicht lauffähig**: Der TypeScript-Build (`tsc`) kompiliert wegen der Pfadauflösung
von `@klimainstall/shared` (Monorepo-Workspace, nur als `.ts`-Quelle vorhanden) in einen
verschachtelten Ordner, dessen Modul-Importe zur Laufzeit nicht auflösen. Das Docker-Image
umgeht das pragmatisch, indem der Server — wie im bisherigen Dev-/Codespace-Betrieb auch —
direkt über `tsx` gestartet wird (`server/Dockerfile`, `CMD ["npx", "tsx", "src/index.ts"]`).
Funktioniert zuverlässig, ist aber minimal langsamer beim Start als ein fertig kompilierter
Build. Eine spätere Bereinigung des `tsc`-Build-Setups (eigener Build-Schritt für `shared`,
korrekter `outDir`) wäre ein sinnvoller, unabhängiger Aufräum-Task.

### Hinweis zu Puppeteer/Chromium

Die Angebots-PDF-Erstellung nutzt Puppeteer (Chromium headless). Das `server/Dockerfile`
basiert bewusst auf `node:22-slim` (Debian, nicht Alpine) und installiert die dafür nötigen
Systembibliotheken sowie `unzip` (für die Chromium-Extraktion beim `npm ci`). Zusätzlich
startet Puppeteer im Code mit `--no-sandbox`, da der Container standardmässig als root läuft
und Chromiums Sandbox das sonst verweigert (`server/src/pdf/quotePdf.ts`). Beides wurde in
einem echten Container-Testlauf verifiziert (PDF-Erstellung erfolgreich).

## 5. GitHub Actions: automatisches Deployment bei Push auf main

`.github/workflows/deploy.yml` ist vorbereitet, aber inaktiv, bis die nötigen Secrets gesetzt
sind. Strategie: das Image wird **auf dem Server selbst** gebaut (`docker compose up --build`),
nicht in der CI mit Push in eine Registry — für ein einzelnes kleines VPS deutlich einfacher.

Repository-Secrets (GitHub → Settings → Secrets and variables → Actions):

| Secret            | Wert                                                         |
|-------------------|---------------------------------------------------------------|
| `DEPLOY_HOST`     | IP oder Hostname des Hetzner-Servers                          |
| `DEPLOY_USER`     | `deploy` (der oben angelegte SSH-Benutzer)                    |
| `DEPLOY_SSH_KEY`  | Privater SSH-Key für `deploy` (Public Key liegt auf dem Server)|
| `DEPLOY_PATH`     | `/opt/simplycool-crm`                                          |

Sobald gesetzt, läuft bei jedem Push auf `main`: `git pull` → `docker compose up -d --build`
→ Migration. Bis dahin: manuelles Deployment über SSH (Schritt 3+4 wiederholen: `git pull`,
`docker compose up -d --build`, ggf. `docker compose exec -T server npm run db:migrate`).

## 6. Umgebungsvariablen auf dem Server

In `.env` neben `docker-compose.yml` (Vorlage: `.env.production.example`):

| Variable            | Bedeutung                                                              |
|---------------------|--------------------------------------------------------------------------|
| `DOMAIN`             | `simply-cool.ch` — für Caddy (SSL) und `CLIENT_ORIGIN` (CORS)          |
| `POSTGRES_PASSWORD`  | Beliebiges starkes Passwort für die Datenbank                          |
| `SESSION_SECRET`     | Zufallsstring für Session-Cookies, z.B. `openssl rand -hex 32`         |

**Wichtig:** SMTP-Zugangsdaten (für die Rechnungs-/Mahnungs-Mails und die neue
Lead-Benachrichtigung) sowie die Admin-Benachrichtigungs-E-Mail-Adresse werden **nicht** über
Umgebungsvariablen gesetzt, sondern direkt in der App unter **Einstellungen** gepflegt
(dort in der Datenbank gespeichert, nicht im Environment):
- "E-Mail-Versand (SMTP)" → SMTP-Host/Port/Benutzer/Passwort
- "Admin-E-Mail für neue Website-Leads" → Zieladresse für die Lead-Benachrichtigung

Diese Einstellungen also nach dem ersten Deployment einmal im Browser unter
`https://simply-cool.ch/app/einstellungen` nachtragen.

## 7. Backups

`postgres_data` und `uploads_data` sind Docker-Volumes. Minimaler Backup-Ansatz (Cronjob auf
dem Server):

```bash
docker compose exec -T postgres pg_dump -U klimainstall klimainstall | gzip > backup-$(date +%F).sql.gz
```

Zusätzlich `uploads_data` regelmässig sichern (z.B. `docker run --rm -v simplycool-crm_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-$(date +%F).tar.gz /data`).
