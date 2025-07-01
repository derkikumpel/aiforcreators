import fs from 'fs-extra';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// OpenAI initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt an GPT
const prompt = `
Nenne mir bitte 10 relevante AI-Tools für Chemiker im Jahr 2025. 
Fokus: Molekülgenerierung, QSAR, Docking, retrosynthetische Analyse, Wirkstoffdesign.
Für jedes Tool gib bitte folgendes als JSON-Array zurück:

[
  {
    "name": "Tool-Name",
    "url": "https://...",
    "description": "ca. 150 Wörter Beschreibung (in englisch)",
    "category": "z. B. Molecule Optimization"
  },
  ...
]
`;

async function fetchToolsFromGPT() {
  console.log('🤖 Frage GPT nach Chemie-AI-Tools…');

  const chat = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Du bist ein Research Assistant für cheminformatische Werkzeuge.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  const content = chat.choices[0].message.content.trim();

  try {
    const tools = JSON.parse(content);

    // Slugs hinzufügen
    tools.forEach(tool => {
      tool.slug = tool.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    });

    await fs.ensureDir('./data');
    await fs.writeJson('./data/tools.json', tools, { spaces: 2 });

    console.log(`✅ ${tools.length} Tools gespeichert unter data/tools.json`);
  } catch (err) {
    console.error('❌ Fehler beim Parsen der GPT-Antwort:', err.message);
    console.log('📄 GPT-Inhalt war:', content);
  }
}

fetchToolsFromGPT().catch(console.error);
