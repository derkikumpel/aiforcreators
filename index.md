---
layout: default
title: Home
---
## Top AI Chemistry Tools

{% for tool in site.data.tools %}
- [{{ tool.name }}]({{ tool.url }}) - {{ tool.category }} ({{ tool.price }})
{% endfor %}
