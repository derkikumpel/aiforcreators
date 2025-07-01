import { chromium } from 'playwright';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

async function captureScreenshot(tool) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(tool.url);
  const screenshot = await page.screenshot();
  const result = await cloudinary.uploader.upload(screenshot, {
    public_id: `chem-tools/${tool.slug}`
  });
  await browser.close();
  return result.secure_url;
}

(async () => {
  const tools = await fs.readJson('./data/tools.json');
  for (const tool of tools) {
    tool.image = await captureScreenshot(tool);
  }
  await fs.writeJson('./data/tools.json', tools);
})();
