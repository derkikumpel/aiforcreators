import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI();

async function discoverTools() {
  console.log('Starte GPT-basierte Tool-Suche...');

  const prompt = `
    Please list 10 current AI tools in the field of cheminformatics or drug discovery.
    For each tool, return a JSON object with the following fields:
    - name (string)
    - slug (string, lowercase, spaces replaced by dashes)
    - url (string)
    - short_description (string, 30–50 words)
    - long_description (string, 150–250 words)
    - tags (array of up to 6 strings)
    -  category (string, e.g., synthesis, analysis, database)

    Respond only with the JSON array. No additional explanation.
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
