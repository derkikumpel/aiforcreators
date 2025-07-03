import fs from 'fs-extra';
import { chromium } from 'playwright';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function captureScreenshot(tool) {
  let browser;
  try {
    console.log(`🌐 Öffne Browser für ${tool.name}: ${tool.url}`);
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    const response = await page.goto(tool.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    if (!response || !response.ok()) {
      throw new Error(`Seite nicht erreichbar (Status: ${response?.status() || 'n/a'})`);
    }

    // Prüfe Titel auf mögliche Sicherheitswarnungen
    const title = await page.title();
    if (title.toLowerCase().includes('warnung') || title.toLowerCase().includes('security risk') || title.toLowerCase().includes('mögliches sicherheitsrisiko')) {
      throw new Error('Sicherheitsrisiko erkannt, Screenshot wird nicht erstellt.');
    }

    await page.waitForTimeout(3000);

    const screenshotBuffer = await page.screenshot({ fullPage: false });
    const base64 = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    console.log(`📤 Lade Screenshot zu Cloudinary hoch...`);
    const result = await cloudinary.uploader.upload(base64, {
      folder: 'chem-ai-tools',
      public_id: tool.slug,
      overwrite: true,
    });

    return result.secure_url;
  } catch (error) {
    console.error(`⚠️ Screenshot fehlgeschlagen für ${tool.name}: ${error.message || error}`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

export async function checkAndCaptureScreenshots() {
  try {
    const tools = await fs.readJson('./data/tools.json');
    console.log(`📸 Starte Screenshots für ${tools.length} Tools.`);

    const validTools = [];

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      try {
        console.log(`\n[${i + 1}/${tools.length}] Screenshot für ${tool.name} erstellen...`);
        const imageUrl = await captureScreenshot(tool);
        tool.screenshot = imageUrl;
        validTools.push(tool);
        console.log(`✅ Screenshot gespeichert: ${imageUrl}`);
      } catch (error) {
        console.warn(`⚠️ Tool ${tool.name} wird entfernt, da kein Screenshot möglich ist.`);
        // Tool wird nicht in validTools aufgenommen
      }
    }

    await fs.writeJson('./data/tools.json', validTools, { spaces: 2 });
    console.log('\n✅ Screenshots aktualisiert, ungültige Tools entfernt.');
    return validTools;
  } catch (error) {
    console.error('❌ Fehler im Screenshot-Prozess:', error.message || error);
    throw error;
  }
}

// CLI Entrypoint (damit 'node screenshot-tools.mjs' funktioniert)
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndCaptureScreenshots().catch(err => {
    console.error('❌ Unerwarteter Fehler:', err);
    process.exit(1);
  });
}
