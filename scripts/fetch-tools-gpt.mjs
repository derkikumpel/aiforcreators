import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

const cacheFile = './data/description-cache.json';
const toolsFile = './data/tools.json';

async function loadCache(file) {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Beschreibungscache ist kein Objekt');
    return parsed;
  } catch {
    console.warn(`⚠️ Beschreibungscache ${file} ungültig oder leer – wird neu erstellt.`);
    return {};
  }
}

async function fetchToolDescriptions(tools) {
  const cache = await loadCache(cacheFile);
  const updatedTools = [];

  for (const tool of tools) {
    if (cache[tool.slug]) {
      console.log(`✔️ ${tool.name} bereits im Cache.`);
      updatedTools.push({ ...tool, ...cache[tool.slug] });
      continue;
    }

    const prompt = `Write two descriptions for the AI tool "${tool.name}" used in chemistry:\n\n1. Short description (30–50 words)\n2. Long description (150–250 words)\n\nReturn as JSON:\n{\n  "short_description": "...",\n  "long_description": "..." \n}`;

    let description = null;

    for (const model of openaiModels) {
      try {
        console.log(`→ Generiere Beschreibung mit ${model} für ${tool.name}`);
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        description = JSON.parse(completion.choices[0].message.content.trim());
        break;
      } catch (error) {
        console.warn(`⚠️ Fehler mit ${model} für ${tool.name}: ${error.message}`);
      }
    }

    if (!description) {
      console.warn(`⚠️ Beschreibung fehlt, Standardtext verwendet für ${tool.name}`);
      description = {
        short_description: tool.short_description || 'No description available.',
        long_description: tool.long_description || 'No long description available.',
      };
    }

    cache[tool.slug] = description;
    updatedTools.push({ ...tool, ...description });
    await fs.writeJson(cacheFile, cache, { spaces: 2 });
  }

  return updatedTools;
}

async function main() {
  try {
    const tools = await fs.readJson(toolsFile);
    if (!Array.isArray(tools) || !tools.length) {
      console.log('⚠️ Keine Tools gefunden, breche ab.');
      return;
    }

    const updatedTools = await fetchToolDescriptions(tools);
    await fs.writeJson(toolsFile, updatedTools, { spaces: 2 });
    console.log(`💾 Alle Beschreibungen aktualisiert (${updatedTools.length} Tools).`);
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
}

main();
