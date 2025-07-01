import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI();

async function discoverTools() {
  console.log('Starte GPT-basierte Tool-Suche...');

  const prompt = `
Bitte nenne mir 10 aktuelle AI-Tools im Bereich Cheminformatik / Drug Discovery.
Gib für jedes Tool die folgenden Felder als JSON zurück:
- name (string)
- slug (string, name in Kleinbuchstaben, Leerzeichen durch Bindestrich)
- url (string)
- description (string, 150 Wörter, maximal 250)
- tags (Array von Strings, max. 6 Tags)
- category (string, z.B. synthesis, analysis, database)

Antwort nur das JSON-Array, keine weitere Erklärung.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content.trim();

    // JSON sauber aus dem GPT-Text rausschneiden (zwischen erstem [ und letztem ])
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Kein JSON-Array im GPT-Response gefunden');
    }

    const jsonString = raw.substring(jsonStart, jsonEnd + 1);
    const tools = JSON.parse(jsonString);

    await fs.writeJson('./data/tools.json', tools, { spaces: 2 });
    console.log(`✅ Tools gespeichert: ${tools.length} Einträge`);
  } catch (error) {
    console.error('❌ Fehler bei der Tool-Suche:', error);
  }
}

discoverTools();
