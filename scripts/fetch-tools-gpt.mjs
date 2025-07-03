import fs from 'fs-extra';
import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
const cacheFile = './data/description-cache.json';

async function queryAI21(prompt) {
  console.log('Versuche AI21 Jurassic-2 als Fallback...');
  const response = await fetch('https://api.ai21.com/studio/v1/j2-large/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI21_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      maxTokens: 800,
      temperature: 0.7,
      stopSequences: ["\n\n"],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI21 API Fehler: ${response.status} ${response.statusText}`);
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

    // OpenAI alle Modelle probieren
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
        if (error.status === 429) {
          console.warn(`Rate limit bei ${model}, versuche nächstes Modell...`);
        } else {
          console.error(`Fehler bei ${tool.name} mit ${model}:`, error.message);
          break;
        }
      }
    }

    // AI21 Fallback, falls OpenAI fehlschlägt
    if (!description) {
      try {
        const ai21Prompt = `Write two descriptions for the AI tool "${tool.name}" used in chemistry:

1. Short description (30–50 words) for a tools overview page.
2. Long description (150–250 words) for a detailed page.

Respond in the following JSON format:
{
  "short_description": "...",
  "long_description": "..."
}`;

        const raw = await queryAI21(ai21Prompt);
        description = JSON.parse(raw);
        console.log(`✅ Beschreibung für ${tool.name} mit AI21 generiert.`);
      } catch (error) {
        console.warn(`Keine Beschreibung für ${tool.name} mit AI21 generiert:`, error.message);
      }
    }

    // Falls keine Beschreibung generiert werden konnte
    if (!description) {
      console.warn(`Keine Beschreibung für ${tool.name} generiert, benutze Standardtext.`);
      description = {
        short_description: tool.short_description || 'Beschreibung konnte nicht geladen werden.',
        long_description: tool.long_description || 'Beschreibung konnte nicht geladen werden.',
      };
    }

    updatedTools.push({ ...tool, ...description });
    cache[tool.slug] = description;

    // Cache speichern nach jedem Tool
    await fs.writeJson(cacheFile, cache, { spaces: 2 });
  }

  return updatedTools;
}

async function main() {
  try {
    console.log('Lese tools.json...');
    const tools = await fs.readJson('./data/tools.json');
    console.log(`tools.json enthält ${tools.length} Tools.`);

    const updatedTools = await fetchToolDescriptions(tools);

    console.log('Schreibe aktualisierte Tools zurück in tools.json...');
    await fs.writeJson('./data/tools.json', updatedTools, { spaces: 2 });
    console.log('✅ Beschreibungen aktualisiert und gespeichert.');
  } catch (error) {
    console.error('Fehler:', error.message);
  }
}

main();
