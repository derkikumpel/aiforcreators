import fs from 'fs-extra';
import path from 'path';
import handlebars from 'handlebars';

const toolsFile = './data/tools.json';
const templateFile = './templates/tool-template.html';
const outputDir = './tools';

async function generateDetailPages() {
  console.log('🚀 Starte Generierung der Detailseiten...');

  let tools;
  try {
    tools = await fs.readJson(toolsFile);
    if (!Array.isArray(tools)) throw new Error('tools.json ist kein Array');
    console.log(`📦 ${tools.length} Tools geladen.`);
  } catch (err) {
    console.error(`❌ Fehler beim Lesen von ${toolsFile}:`, err.message);
    process.exit(1);
  }

  let rawTemplate;
  try {
    rawTemplate = await fs.readFile(templateFile, 'utf8');
    console.log(`🧩 Template geladen: ${templateFile}`);
  } catch (err) {
    console.error(`❌ Fehler beim Laden des Templates:`, err.message);
    process.exit(1);
  }

  const template = handlebars.compile(rawTemplate);

  try {
    await fs.ensureDir(outputDir);
  } catch (err) {
    console.error(`❌ Fehler beim Erstellen des Output-Ordners "${outputDir}":`, err.message);
    process.exit(1);
  }

  let successCount = 0;

  for (const tool of tools) {
  if (!tool.slug) {
    console.warn(`⚠️ Übersprungen: Tool ohne "slug": ${tool.name || 'Unbenanntes Tool'}`);
    continue;
  }

  try {
    const html = template({
      name: tool.name,
      url: tool.url,
      image: tool.screenshot,
      long_description: tool.long_description,
      tags: tool.tags || [],
    });

    const filePath = path.join(outputDir, `${tool.slug}.html`);
    await fs.writeFile(filePath, html, 'utf8');
    console.log(`✅ Generiert: ${filePath}`);
    successCount++;
  } catch (err) {
    console.warn(`⚠️ Fehler beim Generieren von ${tool.slug}:`, err.message);
  }
}

  console.log(`🎉 Fertig: ${successCount} Seiten erfolgreich generiert.`);
}

generateDetailPages().catch(err => {
  console.error('❌ Unerwarteter Fehler bei der Seitengenerierung:', err);
  process.exit(1);
});
