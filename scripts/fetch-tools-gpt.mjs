import dotenv from 'dotenv';
dotenv.config();

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
      const prompt = `Schreibe eine kurze, professionelle Beschreibung von 150-250 Wötern für das AI-Tool "${tool.name}" im Bereich Chemie.`;
      console.log(`\nGeneriere Beschreibung für Tool: ${tool.name}`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const description = completion.choices[0].message.content.trim();

      updatedTools.push({ ...tool, description });
      console.log(`✅ Beschreibung für ${tool.name} generiert.`);
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
