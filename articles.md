---
title: Articles
layout: page
---

{%- assign date_format = site.minima.date_format | default: "%b %-d, %Y" -%}

<ul class="article-list">
  {% for post in site.posts %}
    <li class="article-card">
      <a class="article-card-link" href="{{ post.url | relative_url }}">
        <div class="article-card-meta">{{ post.date | date: date_format }}</div>
        <h2 class="article-card-title">{{ post.title }}</h2>
        <div class="article-preview">
          {{ post.excerpt }}
        </div>
      </a>
    </li>
  {% endfor %}
</ul>