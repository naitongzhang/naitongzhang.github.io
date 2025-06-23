---
title: Browse by Topic
layout: page
---

<div class="topic-index">
  <h2>Browse by Category</h2>
  <ul class="topic-list">
    {% assign sorted_categories = site.categories | sort %}
    {% for category in sorted_categories %}
      <li>
        <a href="{{ '/categories/' | append: category[0] | slugify | append: '/' | relative_url }}">{{ category[0] | capitalize }}</a>
        <span class="post-count">({{ category[1].size }})</span>
      </li>
    {% endfor %}
  </ul>

  <h2>Browse by Tag</h2>
  <ul class="topic-list">
    {% assign sorted_tags = site.tags | sort %}
    {% for tag in sorted_tags %}
      <li>
        <a href="{{ '/tags/' | append: tag[0] | slugify | append: '/' | relative_url }}">{{ tag[0] }}</a>
        <span class="post-count">({{ tag[1].size }})</span>
      </li>
    {% endfor %}
  </ul>
</div>