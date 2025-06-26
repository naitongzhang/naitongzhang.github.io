---
title: Artworks
layout: page
---

<ul class="artwork-gallery">

  {% assign sorted_artworks = site.artworks | sort: 'date_created' | reverse %}

  {% for artwork in sorted_artworks %}

    <li>

      <a href="{{ artwork.url | relative_url }}" class="artwork-link">
        {% if artwork.image %}<img src="{{ artwork.image | relative_url }}" alt="{{ artwork.title }}">{% endif %}
        <h3>{{ artwork.title }}</h3>
      </a>

      {%- if artwork.date_created or artwork.content != "" -%}
      <div class="artwork-description">
        {% if artwork.date_created %}<p class="artwork-date">{{ artwork.date_created | date: "%B %Y" }}</p>{% endif %}
        {{ artwork.content | markdownify }}
      </div>
      {%- endif -%}

    </li>

  {% endfor %}
  
</ul>