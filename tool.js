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
      const preview = document.getElementById('tool-preview');
      preview.src = `https://image.thum.io/get/width/1000/crop/800/noanimate/${tool.url}`;
      preview.alt = tool.name + ' preview';
      const link = document.getElementById('tool-link');
      link.href = tool.url;

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
