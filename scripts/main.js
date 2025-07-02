let allTools = [];
let activeTags = new Set();

// Tools laden
async function loadTools() {
  const response = await fetch('data/tools.json');
  if (!response.ok) {
    console.error('❌ Failed to load tools.json');
    return [];
  }
  return await response.json();
}

// Tools rendern
function renderTools(tools) {
  const grid = document.getElementById('toolGrid');
  grid.innerHTML = '';

  // Sortiere Tools alphabetisch
  const visible = tools.filter(tool => {
    if (activeTags.size === 0) return true;
    return tool.tags?.some(tag => activeTags.has(capitalize(tag)));
  });

  if (visible.length === 0) {
    grid.innerHTML = `<p>No tools match the selected filters.</p>`;
    return;
  }

  for (const tool of visible) {
    const card = document.createElement('div');
    card.className = 'tool-card';

    card.innerHTML = `
      <img src="${tool.screenshot || 'assets/placeholder.png'}" alt="${tool.name}" onerror="this.src='assets/placeholder.png'" />
      <div class="content">
        <h3>${tool.name}</h3>
        <p>${tool.short_description || tool.long_description?.substring(0, 100) + '...' || ''}</p>
        <a href="tools/${tool.slug}.html">Details →</a>
      </div>
    `;

    grid.appendChild(card);
  }
}

// Filter erzeugen
function generateFilters(tools) {
  const container = document.getElementById('filters');
  const tagSet = new Set();

  for (const tool of tools) {
    if (Array.isArray(tool.tags)) {
      tool.tags.forEach(tag => tagSet.add(capitalize(tag)));
    }
  }

  const sortedTags = Array.from(tagSet).sort();

  for (const tag of sortedTags) {
    const filter = document.createElement('div');
    filter.className = 'filter-option';
    filter.textContent = tag;
    filter.dataset.tag = tag;

    filter.addEventListener('click', () => {
      filter.classList.toggle('active');
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
      } else {
        activeTags.add(tag);
      }
      renderTools(allTools);
    });

    container.appendChild(filter);
  }
}

// Großbuchstaben
function capitalize(tag) {
  return tag.replace(/\b\w/g, char => char.toUpperCase());
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  allTools = await loadTools();
  generateFilters(allTools);
  renderTools(allTools);
});
