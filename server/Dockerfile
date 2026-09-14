# Läuft den Server über tsx (wie im Dev-/Codespace-Betrieb) statt über den
# tsc-kompilierten Output: server/package.json "start" (node dist/index.js) ist derzeit
# nicht lauffähig, da @klimainstall/shared im Monorepo nur als TS-Quelle vorliegt und die
# Pfadauflösung beim reinen "tsc build" nicht korrekt auf ein lauffähiges dist/ abbildet.
# tsx umgeht das (identisch zum bisherigen Betrieb) und ist der pragmatischste Weg, ohne
# das bestehende Build-Setup anzufassen. Siehe DEPLOYMENT.md für Details.
#
# Debian-Slim statt Alpine: Puppeteer/Chromium (für die Angebots-PDF-Erstellung) läuft auf
# Alpine/musl erfahrungsgemäss nicht zuverlässig. Die apt-Pakete unten sind exakt die, die
# im Codespace-Betrieb dieses Projekts nötig waren, damit Chromium headless startet.
FROM node:22-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates unzip \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libnss3 libxshmfence1 libcairo2 \
    libglib2.0-0 libx11-6 libxcb1 libxext6 libgdk-pixbuf2.0-0 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Erst nur die package.json aller Workspaces kopieren, damit "npm ci" den Docker-Layer-Cache nutzen kann
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
COPY shared/package.json shared/package.json
RUN npm ci

COPY shared ./shared
COPY server ./server

WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 4000

CMD ["npx", "tsx", "src/index.ts"]
