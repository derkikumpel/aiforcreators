import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const models = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
const cacheFile = './data/discover-cache.json';

async function discoverTools() {
  console.log('Starte GPT-basierte Tool-Suche...');

  // Cache laden (falls vorhanden)
  let cache = [];
  try {
    cache = await fs.readJson(cacheFile);
    console.log(`Cache geladen, enthält ${cache.length} Tools.`);
  } catch {
    console.log('Kein Cache gefunden, frische Suche...');
  }

  const prompt = `
Please list 10 current AI tools in the field of cheminformatics or drug discovery.
For each tool, return a JSON object with the following fields:
- name (string)
- slug (string, lowercase, spaces replaced by dashes)
- url (string)
- short_description (string, 30–50 words)
- long_description (string, 150–250 words)
- tags (array of up to 6 strings)
- category (string, e.g., synthesis, analysis, database)

Respond only with the JSON array. No additional explanation.
`;

  let tools = null;

  for (const model of models) {
    try {
      console.log(`Versuche Modell ${model}...`);
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const raw = completion.choices[0].message.content.trim();

      const jsonStart = raw.indexOf('[');
      const jsonEnd = raw.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Kein JSON-Array im GPT-Response gefunden');
      }

      const jsonString = raw.substring(jsonStart, jsonEnd + 1);
      tools = JSON.parse(jsonString);

      console.log(`✅ Tools erfolgreich mit ${model} entdeckt.`);
      break;
    } catch (error) {
      if (error.status === 429) {
        console.warn(`Rate limit bei ${model}, versuche nächstes Modell...`);
      } else {
        console.error(`Fehler bei ${model}:`, error.message);
        break;
      }
    }
  }

  if (!tools) {
    console.error('❌ Konnte keine Tools entdecken.');
    tools = cache.length > 0 ? cache : [];
  } else {
    // Optional: Vergleich mit Cache (nur neue hinzufügen)
    const knownSlugs = new Set(cache.map(t => t.slug));
    tools = tools.filter(t => !knownSlugs.has(t.slug));
    if (tools.length === 0) {
      console.log('Keine neuen Tools gefunden, benutze Cache.');
      tools = cache;
    } else {
      // Neue Tools zum Cache hinzufügen
      tools = [...cache, ...tools];
      await fs.writeJson(cacheFile, tools, { spaces: 2 });
    }
  }

  // Immer in tools.json speichern
  await fs.writeJson('./data/tools.json', tools, { spaces: 2 });
  console.log(`✅ Tools gespeichert: ${tools.length} Einträge.`);
}

discoverTools();

