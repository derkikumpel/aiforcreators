// Hilfsfunktion: Jedes Wort großschreiben (für Filter-Labels & Anzeige)
function capitalizeWords(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1));
}

// tools.json laden
async function loadTools() {
  try {
    const response = await fetch('data/tools.json');
    if (!response.ok) throw new Error("Failed to load tools.json");
    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Alle Tags aus Tools extrahieren, großgeschrieben und sortiert, unique
function extractTags(tools) {
  const tagSet = new Set();
  tools.forEach(tool => {
    (tool.tags || []).forEach(tag => {
      tagSet.add(capitalizeWords(tag));
    });
  });
  return Array.from(tagSet).sort();
}

// Filter-Checkboxen dynamisch erzeugen
function renderFilters(tags) {
  const form = document.getElementById('filter-form');
  form.innerHTML = '';
  tags.forEach(tag => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" name="tag" value="${tag}" />
      ${tag}
    `;
    form.appendChild(label);
  });
}

// Tools rendern inkl. Tags
function renderTools(tools) {
  const container = document.getElementById('toolGrid');
  if (tools.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #bbb;">No tools match your filters.</p>';
    return;
  }

  container.innerHTML = tools.map(tool => {
    const tagsHTML = (tool.tags || [])
      .map(tag => `<span class="tag">${capitalizeWords(tag)}</span>`)
      .join(' ');

    return `
      <div class="tool-card">
        <img 
          src="${tool.screenshot || 'assets/placeholder.png'}" 
          alt="${tool.name}" 
          onerror="this.src='assets/placeholder.png'" 
        />
        <div class="tool-info">
          <h3>${tool.name}</h3>
          <div class="tool-tags">${tagsHTML}</div>
          <p>${tool.short_description || ''}</p>
          <a href="tools/${tool.slug}.html">Details →</a>
        </div>
      </div>
    `;
  }).join('');
}

// Filter anwenden
function applyFilters(tools) {
  const checkedBoxes = [...document.querySelectorAll('#filter-form input[type="checkbox"]:checked')];
  const selectedTags = checkedBoxes.map(cb => cb.value);

  if (selectedTags.length === 0) return tools;

  return tools.filter(tool => {
    const toolTags = (tool.tags || []).map(capitalizeWords);
    return selectedTags.every(tag => toolTags.includes(tag));
  });
}

// Filter-Listener
function setupFiltering(tools) {
  const filterForm = document.getElementById('filter-form');
  if (!filterForm) return;

  filterForm.addEventListener('change', () => {
    const filtered = applyFilters(tools);
    renderTools(filtered);
  });
}

// Suche anwenden
function setupSearch(tools) {
  const searchInput = document.getElementById('search-bar');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    const filteredByCategory = applyFilters(tools);

    const searched = filteredByCategory.filter(tool => {
      const inName = tool.name?.toLowerCase().includes(query);
      const inDesc = tool.short_description?.toLowerCase().includes(query);
      const inTags = tool.tags?.some(tag => tag.toLowerCase().includes(query));
      return inName || inDesc || inTags;
    });

    renderTools(searched);
  });
  
}
// Zeitstempel laden
async function loadLastUpdated() {
  try {
    const res = await fetch('data/last-updated.json');
    if (!res.ok) throw new Error('last-updated.json not found');
    const json = await res.json();
    return new Date(json.updated);
  } catch (err) {
    console.error('Fehler beim Laden des Aktualisierungsdatums:', err);
    return null;
  }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
  const tools = await loadTools();

  const tags = extractTags(tools);
  renderFilters(tags);
  renderTools(tools);
  setupFiltering(tools);
  setupSearch(tools);

  const updateEl = document.getElementById('update-date');
  const updatedDate = await loadLastUpdated();
  if (updateEl && updatedDate) {
    updateEl.textContent = updatedDate.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
});
