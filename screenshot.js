const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const tools = JSON.parse(fs.readFileSync('./data/tools.json', 'utf-8'));

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const screenshotDir = path.join(__dirname, 'images', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  for (const tool of tools) {
    const fileName = `${tool.slug}.jpg`;
    const outputPath = path.join(screenshotDir, fileName);

    console.log(`📸 Screenshotting ${tool.name}...`);

    try {
      await page.goto(tool.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.setViewport({ width: 1280, height: 720 });
      await page.screenshot({ path: outputPath, type: 'jpeg', quality: 80 });
      console.log(`✅ Saved: ${fileName}`);
    } catch (err) {
      console.warn(`❌ Error for ${tool.name}: ${err.message}`);
    }
  }

  await browser.close();
})();
