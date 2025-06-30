document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('tool');

  fetch('data/tools.json')
    .then(res => res.json())
    .then(tools => {
      const tool = tools.find(t => t.slug === slug);
      if (!tool) {
        document.body.innerHTML = '<h2>Tool not found</h2><p><a href="index.html">Back</a></p>';
        return;
      }

      document.title = tool.name + ' | AI Tools for Chemists';
      document.getElementById('tool-name').textContent = tool.name;
      document.getElementById('tool-description').textContent = tool.description;
      document.getElementById('tool-logo').src = `https://www.google.com/s2/favicons?sz=128&domain_url=${tool.url}`;
      document.getElementById('tool-logo').alt = tool.name + ' logo';
      const link = document.getElementById('tool-link');
      link.href = tool.url;
      link.textContent = 'Visit ' + tool.name;

      const tagsDiv = document.getElementById('tool-tags');
      tagsDiv.innerHTML = '';
      tool.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tagsDiv.appendChild(span);
      });
    });
});