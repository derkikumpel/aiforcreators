import fs from 'fs-extra';
import path from 'path';

const tools = await fs.readJson('./data/tools.json');

await fs.ensureDir('./tools');

function generateDescription(name, shortDesc, tags) {
  return `${name} is an AI-driven tool designed to support modern chemists in their daily work. ${shortDesc} It provides features such as ${tags.slice(0, 2).join(" and ")}, making it a valuable resource for professionals in research and industry. Whether you're engaged in drug discovery, materials science, or computational modeling, ${name} helps streamline complex workflows and enables faster, data-driven decisions. Its interface is accessible, and integration with various chemistry platforms makes it both powerful and practical for diverse use cases.`;
}

for (const tool of tools) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tool.name} – AI Tools for Chemists</title>
  <link rel="stylesheet" href="../styles.css" />
</head>
<body>
  <header class="site-header">
    <a href="/" class="logo-link">
      <img src="../logo/logoAfC.png" alt="AI Tools for Chemists Logo" class="site-logo" />
    </a>
  </header>

  <main class="tool-detail">
    <div class="tool-detail-left">
      <h1>${tool.name}</h1>
      <p>${generateDescription(tool.name, tool.description, tool.tags)}</p>
      ${tool.free ? `<a href="${tool.url}" class="tool-link-button" target="_blank">Try Free</a>` : ""}
    </div>
    <div class="tool-detail-right">
      <img src="${tool.image || '../assets/placeholder.png'}" alt="${tool.name} Screenshot" />
    </div>
  </main>
</body>
</html>
`;

  const outPath = path.join('tools', `${tool.slug}.html`);
  await fs.writeFile(outPath, html);
}

console.log('✅ All tool detail pages generated!');
