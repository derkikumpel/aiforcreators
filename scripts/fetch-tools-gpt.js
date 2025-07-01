import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs-extra';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function fetchToolDescriptions(tools) {
  const updatedTools = [];

  for (const tool of tools) {
    try {
      const prompt = `Schreibe eine kurze, professionelle Beschreibung für das AI-Tool "${tool.name}" im Bereich Chemie.`;

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
    const tools = await fs.readJson('./data/tools.json');
    const toolsWithDescriptions = await fetchToolDescriptions(tools);
    await fs.writeJson('./data/tools.json', toolsWithDescriptions, { spaces: 2 });
    console.log('✅ Alle Beschreibungen erfolgreich aktualisiert.');
  } catch (error) {
    console.error('❌ Fehler beim Lesen/Schreiben der tools.json:', error.message);
  }
}

main();
