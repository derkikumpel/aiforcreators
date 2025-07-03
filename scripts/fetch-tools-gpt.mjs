import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ai21ApiKey = process.env.AI21_API_KEY;
const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
const cacheFile = './data/description-cache.json';

async function queryAI21(prompt) {
  console.log('Versuche AI21 Jamba als Fallback...');
  const models = ['jamba-1.5-large', 'jamba-1.5-mini'];

  for (const model of models) {
    try {
      console.log(`→ Versuche Modell: ${model}`);
      const response = await fetch('https://api.ai21.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AI21_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Du bist ein hilfreicher Assistent.' },
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

      if (text) {
        console.log(`✅ Antwort erfolgreich mit ${model} erhalten.`);
        return text;
      } else {
        throw new Error('Antwort-Parsing fehlgeschlagen');
      }

    } catch (error) {
      console.warn(`⚠️ Fehler mit Modell ${model}: ${error.message}`);
      // Versuch nächstes Modell
    }
  }

  throw new Error('❌ Kein AI21-Modell konnte erfolgreich verwendet werden.');
}
  const data = await response.json();
  return data.completions[0].data.text.trim();
}

async function fetchToolDescriptions(tools) {
  let cache = {};
  try {
    cache = await fs.readJson(cacheFile);
    console.log(`Cache geladen mit ${Object.keys(cache).length} Einträgen.`);
  } catch {
    console.log('Kein Cache gefunden, starte frische Generierung...');
  }

  const updatedTools = [];

  for (const tool of tools) {
    if (cache[tool.slug]) {
      console.log(`Cache für ${tool.name} gefunden, benutze gespeicherte Beschreibungen.`);
      updatedTools.push({ ...tool, ...cache[tool.slug] });
      continue;
    }

    let description = null;

    for (const model of openaiModels) {
      try {
        console.log(`Generiere Beschreibungen für ${tool.name} mit Modell ${model}...`);

        const prompt = `Write two descriptions for the AI tool "${tool.name}" used in chemistry:

1. Short description (30–50 words) for a tools overview page.
2. Long description (150–250 words) for a detailed page.

Respond in the following JSON format:
{
  "short_description": "...",
  "long_description": "..."
}`;

        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });

        const raw = completion.choices[0].message.content.trim();
        description = JSON.parse(raw);

        console.log(`✅ Beschreibung für ${tool.name} mit ${model} generiert.`);
        break;
      } catch (error) {
        if (error.status === 429 || error.message.includes('Rate limit')) {
          console.warn(`Rate limit bei ${model}, versuche nächstes Modell...`);
        } else {
          console.error(`Fehler bei ${tool.name} mit ${model}:`, error.message);
          break;
        }
      }
    }

    if (!description && ai21ApiKey) {
      try {
        const ai21Response = await queryAI21(`
Write two descriptions for the AI tool "${tool.name}" used in chemistry:

1. Short description (30–50 words) for a tools overview page.
2. Long description (150–250 words) for a detailed page.

Respond in the following JSON format:
{
  "short_description": "...",
  "long_description": "..."
}`);
        description = JSON.parse(ai21Response);
        console.log(`✅ Beschreibung für ${tool.name} mit AI21 generiert (Fallback).`);
      } catch (error) {
        console.warn(`AI21 Fallback Fehler für ${tool.name}:`, error.message);
      }
    }

    if (!description) {
      console.warn(`Keine Beschreibung für ${tool.name} generiert, benutze Standardtext.`);
      description = {
        short_description: tool.short_description || 'Beschreibung konnte nicht geladen werden.',
        long_description: tool.long_description || 'Beschreibung konnte nicht geladen werden.',
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
    console.log('Lese tools.json...');
    const tools = await fs.readJson('./data/tools.json');
    console.log(`tools.json enthält ${tools.length} Tools.`);

    if (tools.length === 0) {
      console.log('Keine Tools zum Beschreiben gefunden, beende.');
      return;
    }

    const updatedTools = await fetchToolDescriptions(tools);

    console.log('Schreibe aktualisierte Tools zurück in tools.json...');
    await fs.writeJson('./data/tools.json', updatedTools, { spaces: 2 });
    console.log('✅ Beschreibungen aktualisiert und gespeichert.');
  } catch (error) {
    console.error('Fehler:', error.message);
  }
}

main();
