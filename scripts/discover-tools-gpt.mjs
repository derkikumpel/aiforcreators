import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ai21ApiKey = process.env.AI21_API_KEY;

const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
const cacheFile = './data/discover-cache.json';
const toolsFile = './data/tools.json';

async function queryAI21(prompt) {
  console.log('→ AI21 Fallback aktiv: Versuche Jamba (large → mini)...');
  const models = ['jamba-1.6-large', 'jamba-1.6-mini'];

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

async function discoverTools() {
  console.log('🚀 Starte GPT-basierte Tool-Suche...');

  // Lade bestehenden Cache (robust)
  let cache = [];
  try {
    const raw = await fs.readJson(cacheFile);
    cache = Array.isArray(raw) ? raw : [];
    console.log(`🗂️ Cache geladen mit ${cache.length} Tools.`);
  } catch {
    console.log('ℹ️ Kein Cache vorhanden. Frischer Start...');
  }

  const prompt = `
Please list 10 current AI tools in the field of cheminformatics or drug discovery.
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

  // Versuche OpenAI-Modelle
  for (const model of openaiModels) {
    try {
      console.log(`→ Versuche OpenAI Modell: ${model}`);
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const raw = completion.choices?.[0]?.message?.content?.trim() || '';
      const jsonStart = raw.indexOf('[');
      const jsonEnd = raw.lastIndexOf(']');

      if (jsonStart === -1 || jsonEnd === -1) throw new Error('Kein JSON erkannt');

      const json = raw.substring(jsonStart, jsonEnd + 1);
      tools = JSON.parse(json);
      console.log(`✅ Tools gefunden mit ${model}`);
      break;
    } catch (error) {
      console.warn(`⚠️ OpenAI-Fehler (${model}): ${error.message}`);
    }
  }

  // AI21 Fallback
  if (!tools && ai21ApiKey) {
    try {
      const ai21Response = await queryAI21(prompt);
      const jsonStart = ai21Response.indexOf('[');
      const jsonEnd = ai21Response.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('Kein JSON im AI21-Output');
      tools = JSON.parse(ai21Response.substring(jsonStart, jsonEnd + 1));
      console.log('✅ Tools erfolgreich mit AI21 Jamba entdeckt.');
    } catch (error) {
      console.error('❌ AI21-Fallback gescheitert:', error.message);
    }
  }

  // Ergebnis verarbeiten
  if (!tools) {
    console.error('❌ Keine Tools entdeckt. Benutze nur Cache.');
    tools = cache;
  } else {
    const knownSlugs = new Set((cache || []).map(t => t.slug));
    const newTools = tools.filter(t => !knownSlugs.has(t.slug));
    tools = [...cache, ...newTools];

    await fs.writeJson(cacheFile, tools, { spaces: 2 });
    console.log(`💾 Cache aktualisiert (${tools.length} Tools insgesamt).`);
  }

  await fs.writeJson(toolsFile, tools, { spaces: 2 });
  console.log(`✅ Tools gespeichert in ${toolsFile}: ${tools.length} Einträge.`);
}

discoverTools();
