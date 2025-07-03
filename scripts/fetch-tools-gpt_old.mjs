import fs from 'fs-extra';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function fetchToolDescriptions(tools) {
  const updatedTools = [];

  console.log(`Starte die Generierung von Beschreibungen für ${tools.length} Tools.`);

  for (const tool of tools) {
    try {
      const prompt = `Write two descriptions for the AI tool "${tool.name}" used in chemistry:

      1. Short description (30–50 words) for a tools overview page.
      2. Long description (150–250 words) for a detailed page.

      Respond in the following JSON format:
        {
        "short_description": "...",
        "long_description": "..."
      }`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = completion.choices[0].message.content.trim();
      const parsed = JSON.parse(raw);

      updatedTools.push({
        ...tool,
        short_description: parsed.short_description,
        long_description: parsed.long_description,
      });
      console.log(`✅ Beschreibungen für ${tool.name} generiert.`);
      
    } catch (error) {
      console.error(`❌ Fehler bei ${tool.name}:`, error.message);
      updatedTools.push({ ...tool, description: 'Beschreibung konnte nicht geladen werden.' });
    }
  }

  return updatedTools;
}

async function main() {
  try {
    console.log('Lese tools.json...');
    const tools = await fs.readJson('./data/tools.json');
    console.log(`tools.json geladen, enthält ${tools.length} Tools.`);

    const toolsWithDescriptions = await fetchToolDescriptions(tools);

    console.log('Schreibe aktualisierte Tools zurück in tools.json...');
    await fs.writeJson('./data/tools.json', toolsWithDescriptions, { spaces: 2 });
    console.log('✅ Alle Beschreibungen erfolgreich aktualisiert und gespeichert.');
  } catch (error) {
    console.error('❌ Fehler beim Lesen oder Schreiben der tools.json:', error.message);
  }
}

main();
