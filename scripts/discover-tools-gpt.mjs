import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

const cacheFile = './data/discover-cache.json';
const toolsFile = './data/tools.json';

async function loadCache(file) {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Cache ist kein Array');
    return parsed;
  } catch {
    console.warn(`⚠️ Cache ${file} ungültig oder leer – wird neu erstellt.`);
    return [];
  }
}

export async function discoverTools() {
  console.log('🚀 Starte GPT-basierte Tool-Suche...');

  const cache = await loadCache(cacheFile);
  const existingTools = await loadCache(toolsFile);
  const knownSlugs = new Set(existingTools.map(t => t.slug));

  const exclusionList = existingTools.map(t => `- ${t.name} (${t.slug})`).slice(0, 50).join('\n');

  const prompt = `
Please list 10 current AI tools in the field of cheminformatics or drug discovery that are NOT in the following list:

${exclusionList || '- (none listed)'}

For each tool, return a JSON object with:
- name
- slug (lowercase, dash-separated)
- url
- short_description (30–50 words)
- long_description (150–250 words)
- tags (max 6)
- category (e.g. synthesis, analysis, database)

Respond only with the JSON array.
`;

  let tools = null;

  for (const model of openaiModels) {
    try {
      console.log(`→ Versuche OpenAI Modell: ${model}`);
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonStart = raw.indexOf('[');
      const jsonEnd = raw.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('Kein JSON erkannt');

      tools = JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
      console.log(`✅ Tools gefunden mit ${model}`);
      break;
    } catch (error) {
      console.warn(`⚠️ OpenAI-Fehler (${model}): ${error.message}`);
    }
  }

  if (!tools) {
    console.error('❌ Keine neuen Tools entdeckt. Benutze nur Cache.');
    await fs.writeJson(toolsFile, existingTools, { spaces: 2 });
    return existingTools;
  }

  const newTools = tools.filter(t => !knownSlugs.has(t.slug));
  const updatedTools = [...existingTools, ...newTools];
  const updatedCache = [...cache, ...newTools];

  await fs.writeJson(toolsFile, updatedTools, { spaces: 2 });
  await fs.writeJson(cacheFile, updatedCache, { spaces: 2 });

  console.log(`💾 Tools gespeichert: ${updatedTools.length} Einträge.`);
  return updatedTools;
}
