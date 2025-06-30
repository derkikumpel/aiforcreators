fetch('data/tools.json')
  .then(res => res.json())
  .then(tools => {
    const grid = document.getElementById('tool-grid');
    const buttons = document.querySelectorAll('.filter-btn');

    function createCard(tool) {
      const card = document.createElement('div');
      card.className = 'tool-card';
      card.dataset.tags = tool.tags.join(',').toLowerCase();

      card.innerHTML = `
        <h2>${tool.name}</h2>
        <p>${tool.description}</p>
        <a href="${tool.url}" class="btn" target="_blank">Visit</a>
        <div class="tags">${tool.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</div>
      `;
      return card;
    }

    function renderTools(tools) {
      grid.innerHTML = '';
      tools.forEach(tool => {
        const card = createCard(tool);
        grid.appendChild(card);
      });
    }

    renderTools(tools); // Initial render

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.category;
        if (cat === 'all') {
          renderTools(tools);
        } else {
          const filtered = tools.filter(t =>
            t.tags.map(tag => tag.toLowerCase()).includes(cat.toLowerCase())
          );
          renderTools(filtered);
        }
      });
    });
  });
