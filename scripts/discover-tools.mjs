import { chromium } from 'playwright';
import fs from 'fs-extra';

async function discoverTools() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.nature.com/subjects/cheminformatics');
  
  // Beispiel: Extrahiere Tool-Namen und URLs
  const tools = await page.$$eval('.tool-item', items => 
    items.map(item => ({
      name: item.querySelector('h3').innerText,
      url: item.querySelector('a').href,
      slug: item.querySelector('h3').innerText.toLowerCase().replace(/\s+/g, '-')
    }))
  );

  await fs.writeJson('./data/tools.json', tools);
  await browser.close();
}

discoverTools().catch(console.error);
