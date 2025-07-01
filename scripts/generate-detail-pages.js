import fs from 'fs-extra';
import path from 'path';

const template = ({ name, url, description, category, image }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${description}" />
  <title>${name} – AI Tool für Chemiker</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body class="tool-page">
  <main>
    <a href="../index.html">← Zurück zur Übersicht</a>
    <h1>${name}</h1>
    <img src="${image || '../assets/placeholder.png'}" alt="${name}" style="max-width: 100%; border-radius: 8px; margin: 1rem 0;" />
    <p><strong>Kategorie:</strong> ${category}</p>
    <p>${description}</p>
    <p><a href="${url}" target="_blank" rel="noopener">🔗 Zur offiziellen Seite</a></p>
  </main>
</body>
</html>`;

async function generateDetailPages() {
  const toolsPath = './data/tools.json';
  const outputDir = './tools';

  const tools = await fs.readJson(toolsPath);
  await fs.ensureDir(outputDir);

  for (const tool of tools) {
    const html = template(tool);
    const filePath = path.join(outputDir, `${tool.slug}.html`);
    await fs.writeFile(filePath, html, 'utf8');
    console.log(`✅ Generiert: ${filePath}`);
  }
}

generateDetailPages().catch(err => {
  console.error('❌ Fehler beim Generieren der Detailseiten:', err);
  process.exit(1);
});
