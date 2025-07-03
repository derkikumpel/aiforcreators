import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ai21ApiKey = process.env.AI21_API_KEY;

const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
const cacheFile = './data/description-cache.json';

async function queryAI21(prompt) {
  console.log('→ AI21 Fallback aktiv für Beschreibung...');
  const models = ['jamba-1.5-large', 'jamba-1.5-mini'];

  for (const model of models) {
    try {
      console.log(`→ Versuche AI21-Modell: ${model}`);
      const response = await fetch('https://api.ai21.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ai21ApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 800,
          temperature: 0.7,
          top_p: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Fehler bei ${model}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;

    } catch (err) {
      console.warn(`⚠️ Fehler bei ${model}: ${err.message}`);
    }
  }

  throw new Error('❌ Kein AI21-Modell erfolgreich.');
}

async function fetchToolDescriptions(tools) {
  let cache = {};
  try {
    const raw = await fs.readJson(cacheFile);
    cache = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
    console.log(`🗂️ Beschreibungscache geladen (${Object.keys(cache).length} Einträge).`);
  } catch {
    console.log('ℹ️ Kein Cache gefunden, frischer Start...');
  }

  const updatedTools = [];

  for (const tool of tools) {
    if (cache[tool.slug]) {
      console.log(`✔️ ${tool.name} bereits im Cache.`);
      updatedTools.push({ ...tool, ...cache[tool.slug] });
      continue;
    }

    let description = null;
    const prompt = `Write two descriptions for the AI tool "${tool.name}" used in chemistry:\n\n1. Short description (30–50 words)\n2. Long description (150–250 words)\n\nReturn as JSON:\n{\n  "short_description": "...",\n  "long_description": "..." \n}`;

    for (const model of openaiModels) {
      try {
        console.log(`→ Generiere Beschreibung mit ${model} für ${tool.name}`);
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        const raw = completion.choices?.[0]?.message?.content?.trim() || '';
        description = JSON.parse(raw);
        break;
      } catch (error) {
        console.warn(`⚠️ Fehler mit ${model} für ${tool.name}: ${error.message}`);
      }
    }

    if (!description && ai21ApiKey) {
      try {
        const fallbackResponse = await queryAI21(prompt);
        description = JSON.parse(fallbackResponse);
        console.log(`✅ Beschreibung mit AI21 erzeugt für ${tool.name}`);
      } catch (error) {
        console.warn(`❌ AI21-Beschreibung fehlgeschlagen: ${error.message}`);
      }
    }

    if (!description) {
      console.warn(`⚠️ Beschreibung fehlt, Standardtext verwendet für ${tool.name}`);
      description = {
        short_description: tool.short_description || 'Keine Beschreibung verfügbar.',
        long_description: tool.long_description || 'Keine Beschreibung verfügbar.',
      };
    }

    updatedTools.push({ ...tool, ...description });
    cache[tool.slug] = description;
    await fs.writeJson(cacheFile, cache, { spaces: 2 });
  }

  return updatedTools;
}

async function main() {
  try {
    const tools = await fs.readJson('./data/tools.json');
    if (!Array.isArray(tools) || tools.length === 0) {
      console.log('⚠️ Keine Tools gefunden, breche ab.');
      return;
    }

    const updatedTools = await fetchToolDescriptions(tools);
    await fs.writeJson('./data/tools.json', updatedTools, { spaces: 2 });
    console.log(`💾 Alle Beschreibungen aktualisiert (${updatedTools.length} Tools).`);
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
}

main();
