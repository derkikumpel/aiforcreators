import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ai21ApiKey = process.env.AI21_API_KEY;

const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
const cacheFile = './data/discover-cache.json';

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

async function discoverTools() {
  console.log('Starte GPT-basierte Tool-Suche...');

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

  for (const model of openaiModels) {
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
      if (error.status === 429 || error.message.includes('Rate limit')) {
        console.warn(`Rate limit bei ${model}, versuche nächstes Modell...`);
      } else {
        console.error(`Fehler bei ${model}:`, error.message);
        break;
      }
    }
  }

  // AI21 Fallback auch bei leerem Array oder null
  if ((!tools || tools.length === 0) && ai21ApiKey) {
    try {
      const ai21Response = await queryAI21(prompt);
      const jsonStart = ai21Response.indexOf('[');
      const jsonEnd = ai21Response.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Kein JSON-Array im AI21-Response gefunden');
      }
      const jsonString = ai21Response.substring(jsonStart, jsonEnd + 1);
      tools = JSON.parse(jsonString);
      console.log('✅ Tools erfolgreich mit AI21 entdeckt (Fallback).');
    } catch (error) {
      console.error('❌ Fehler bei AI21 Fallback:', error.message);
    }
  }

  if (!tools || tools.length === 0) {
    console.error('❌ Konnte keine Tools entdecken.');
    tools = cache.length > 0 ? cache : [];
  } else {
    const knownSlugs = new Set(cache.map(t => t.slug));
    const newTools = tools.filter(t => !knownSlugs.has(t.slug));

    if (newTools.length === 0) {
      console.log('Keine neuen Tools gefunden, benutze Cache.');
      tools = cache;
    } else {
      tools = [...cache, ...newTools];
      await fs.writeJson(cacheFile, tools, { spaces: 2 });
    }
  }

  await fs.writeJson('./data/tools.json', tools, { spaces: 2 });
  console.log(`✅ Tools gespeichert: ${tools.length} Einträge.`);
}

discoverTools();
