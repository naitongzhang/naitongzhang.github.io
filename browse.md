---
layout: page
title: Browse
permalink: /browse/
---

## Browse by Category

<ul>
  {% for category in site.categories %}
    <li>
      <a href="{{ site.baseurl }}/categories/{{ category | first | slugify }}/">{{ category | first }}</a> ({{ category | last | size }})
    </li>
  {% endfor %}
</ul>

## Browse by Tag

<div class="tag-cloud">
{% for tag in site.tags %}
  <a href="{{ site.baseurl }}/tags/{{ tag | first | slugify }}/" class="tag-item">{{ tag | first }} ({{ tag | last | size }})</a>
{% endfor %}
</div>

<style>
.tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.tag-item { padding: 4px 10px; border: 1px solid #ddd; border-radius: 4px; text-decoration: none; font-size: 0.9em; background-color: #f7f7f7; }
.tag-item:hover { background-color: #eee; border-color: #ccc; }
</style>