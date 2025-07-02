import fs from 'fs-extra';
import path from 'path';

const template = (tool) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${tool.short_description}" />
  <title>${tool.name} – Chem-AI Tool</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body class="tool-page">
  <header>
    <a href="/"><img src="/assets/logoAfC.png" alt="Logo" class="logo" /></a>
    <h1>${tool.name}</h1>
  </header>
  <main class="tool-detail">
    <img src="${tool.screenshot || '../assets/placeholder.png'}" alt="${tool.name}" class="tool-image" />
    <div class="tool-meta">
      <p class="long-description">${tool.long_description}</p>
      <div class="meta-section">
        <h3>Tags</h3>
        <ul>
          ${(tool.tags || []).map(tag => `<li>${capitalizeWords(tag)}</li>`).join('')}
        </ul>
      </div>
      <div class="meta-section">
        <h3>Category</h3>
        <p>${tool.category}</p>
      </div>
      <a class="visit-button" href="${tool.url}" target="_blank">Visit Website</a>
    </div>
  </main>
  <footer>
    <p>&copy; 2025 Chem-AI Directory</p>
  </footer>
</body>
</html>`;

function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

async function generateDetailPages() {
  const tools = await fs.readJson('./data/tools.json');
  const outputDir = './tools';
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
