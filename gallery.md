---
title: Gallery
layout: page
---

<h1>Artworks</h1>

<ul class="post-list">
  {% for artwork in site.artworks %}
    <li>
      <h3><a class="post-link" href="{{ artwork.url | relative_url }}">{{ artwork.title }}</a></h3>
      {% if artwork.image %}<a href="{{ artwork.url | relative_url }}"><img src="{{ artwork.image | relative_url }}" alt="{{ artwork.title }}" style="max-width: 400px;"/></a>{% endif %}
      {{ artwork.content }}
    </li>
  {% endfor %}
</ul>