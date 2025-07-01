import { chromium } from 'playwright';
import { install } from 'playwright-core'; // WICHTIG: Neu hinzugefügt
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';

// Browser explizit installieren
await install('chromium');

// Cloudinary konfigurieren
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

async function captureScreenshot(tool) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(tool.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const screenshot = await page.screenshot({ fullPage: false });
    const result = await cloudinary.uploader.upload(screenshot, {
      folder: 'chem-ai-tools',
      public_id: tool.slug,
      overwrite: true
    });
    
    return result.secure_url;
  } catch (error) {
    console.error(`⚠️ Screenshot failed for ${tool.name}:`, error.message);
    return 'assets/placeholder.png'; // Fallback
  } finally {
    if (browser) await browser.close();
  }
}

// Hauptfunktion
(async () => {
  const tools = await fs.readJson('./data/tools.json');
  for (const tool of tools) {
    if (!tool.image) {
      console.log(`📸 Processing ${tool.name}...`);
      tool.image = await captureScreenshot(tool);
    }
  }
  await fs.writeJson('./data/tools.json', tools, { spaces: 2 });
  console.log('✅ Screenshots updated successfully');
})().catch(err => {
  console.error('❌ Critical error:', err);
  process.exit(1);
});
