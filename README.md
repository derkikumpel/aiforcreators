# 🧪 AI Tools for Chemists

A curated list of AI-powered tools for chemists, built as a fast, automated website using GitHub Pages.

🌐 **Live Website**: [aiforchemists.info](https://aiforchemists.info)

---

## 🔧 Features

- Auto-generated landing page with filters (tags, categories)
- Tool data stored in `data/tools.json`
- Each tool has:
  - Custom detail page
  - Screenshot from real website
  - Tags and description
- Fully static & deployed via GitHub Pages
- Automated screenshots via Puppeteer & Cloudinary

---

## ⚙️ Setup (local)

```bash
npm install
npm run screenshot

Cheminformatics AI Tools Discovery
Dieses Projekt nutzt OpenAI GPT, um aktuelle AI-Tools im Bereich Cheminformatics / Drug Discovery zu entdecken und zu beschreiben.

Setup
Node.js installieren (mindestens v18 empfohlen)

Im Projektordner:

bash
Kopieren
Bearbeiten
npm install
OpenAI API Key setzen:

Lokal in .env Datei (Datei im Projektverzeichnis anlegen):

ini
Kopieren
Bearbeiten
OPENAI_API_KEY=dein_api_key
Oder als Umgebungsvariable setzen (z.B. in CI/CD Umgebung)

Scripts
1. Tools entdecken
bash
Kopieren
Bearbeiten
npm run discover
Fragt GPT nach einer Liste von AI-Tools (Name, URL, Tags, Kategorie etc.).

Speichert die Rohdaten in ./data/tools.json.

2. Tool-Beschreibungen aktualisieren
bash
Kopieren
Bearbeiten
npm run fetch
Lädt tools.json ein.

Fragt GPT für jedes Tool nach einer kurzen, professionellen Beschreibung.

Speichert die erweiterten Daten zurück in tools.json.

Package.json Scripts
json
Kopieren
Bearbeiten
{
  "scripts": {
    "discover": "node scripts/discover-tools-gpt.mjs",
    "fetch": "node scripts/fetch-tools-gpt.mjs"
  }
}
GitHub Actions Beispiel-Workflow
yaml
Kopieren
Bearbeiten
name: Tools Discovery Workflow

on:
  push:
    branches:
      - main

jobs:
  discover-and-fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Node.js Setup
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Dependencies
        run: npm install

      - name: Tools entdecken (GPT-basiert)
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run discover

      - name: Tool-Beschreibungen aktualisieren
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run fetch

      - name: Commit und Push Updates
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add data/tools.json
          git commit -m "Automatisch aktualisierte Tools und Beschreibungen"
          git push
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
Hinweise
OPENAI_API_KEY muss in den Repository Secrets hinterlegt sein (Settings → Secrets → Actions).

Der Workflow wird bei jedem Push auf main ausgeführt.

Du kannst das Intervall oder Event anpassen, z.B. zeitgesteuert mit schedule.

Falls du willst, kann ich das noch auf Deutsch oder in anderer Form ausführlicher machen.
Möchtest du das?
