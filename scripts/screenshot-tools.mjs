import fs from 'fs-extra';
import { chromium } from 'playwright';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config über env vars aus Secrets
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

async function captureScreenshot(tool) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(tool.url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    }).catch(() => {
      console.warn(`⚠️ Timeout oder Fehler beim Laden von ${tool.url}, versuche weiter...`);
    });

    const screenshot = await page.screenshot({ fullPage: false });
    const base64 = `data:image/png;base64,${screenshot.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'chem-ai-tools',
      public_id: tool.slug,
      overwrite: true,
    });

    return result.secure_url;
  } catch (error) {
    console.error(`⚠️ Screenshot fehlgeschlagen für ${tool.name}:`, error.message);
    return 'assets/placeholder.png';
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  try {
    const tools = await fs.readJson('./data/tools.json');
    console.log(`Starte Screenshots für ${tools.length} Tools.`);

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      console.log(`\n[${i + 1}/${tools.length}] Screenshot für ${tool.name} erstellen...`);
      const imageUrl = await captureScreenshot(tool);
      tools[i].screenshot = imageUrl;
      console.log(`✅ Screenshot gespeichert: ${imageUrl}`);
    }

    await fs.writeJson('./data/tools.json', tools, { spaces: 2 });
    console.log('\n✅ Alle Screenshots erfolgreich aktualisiert und gespeichert.');
  } catch (error) {
    console.error('❌ Fehler im Hauptprozess:', error.message);
  }
}

main();

