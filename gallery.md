---
title: Gallery
layout: page
---

<h1>Artworks</h1>

<ul class="artwork-gallery">
  {% assign sorted_artworks = site.artworks | sort: 'date_created' | reverse %}
  {% for artwork in sorted_artworks %}
    <li>
      <a href="{{ artwork.url | relative_url }}" class="artwork-link">
        {% if artwork.image %}<img src="{{ artwork.image | relative_url }}" alt="{{ artwork.title }}">{% endif %}
        <h3>{{ artwork.title }}</h3>
      </a>
      <div class="artwork-description">
        {% if artwork.date_created %}<p class="artwork-date">{{ artwork.date_created | date: "%B %Y" }}</p>{% endif %}
        {% if artwork.categories %}
          <p class="artwork-categories">Categories:
            {% for category in artwork.categories %}
              <a href="{{ '/categories/' | append: category | append: '/' | relative_url }}"><span>{{ category }}</span></a>{% unless forloop.last %}, {% endunless %}
            {% endfor %}
          </p>
        {% endif %}
        {% if artwork.tags %}
          <p class="artwork-tags">Tags:
            {% for tag in artwork.tags %}
              <a href="{{ '/tags/' | append: tag | append: '/' | relative_url }}"><span>{{ tag }}</span></a>{% unless forloop.last %}, {% endunless %}
            {% endfor %}
          </p>
        {% endif %}
        {{ artwork.content | markdownify }}
      </div>
    </li>
  {% endfor %}
</ul>