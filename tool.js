const params = new URLSearchParams(window.location.search);
const slug = params.get('tool');

fetch('data/tools.json')
  .then(res => res.json())
  .then(tools => {
    const tool = tools.find(t => t.slug === slug);
    if (!tool) {
      document.body.innerHTML = '<h2>Tool not found</h2>';
      return;
    }

    document.title = tool.name + ' | AI Tools for Chemists';
    document.getElementById('tool-name').textContent = tool.name;
    document.getElementById('tool-description').textContent = tool.description;
    document.getElementById('tool-logo').src = `https://www.google.com/s2/favicons?sz=64&domain_url=${tool.url}`;
    document.getElementById('tool-logo').alt = `${tool.name} logo`;
    document.getElementById('tool-link').href = tool.url;

    const tagContainer = document.getElementById('tool-tags');
    tool.tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tagContainer.appendChild(span);
    });
  });
