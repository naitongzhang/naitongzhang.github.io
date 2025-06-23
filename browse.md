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
        <a href="{{ site.baseurl }}/categories/{{ category[0] | slugify }}/">{{ category[0] | capitalize }}</a>
        <span class="post-count">({{ category[1].size }})</span>
      </li>
    {% endfor %}
  </ul>

  <h2>Browse by Tag</h2>
  <ul class="topic-list">
    {% assign sorted_tags = site.tags | sort %}
    {% for tag in sorted_tags %}
      <li>
        <a href="{{ site.baseurl }}/tags/{{ tag[0] | slugify }}/">{{ tag[0] }}</a>
        <span class="post-count">({{ tag[1].size }})</span>
      </li>
    {% endfor %}
  </ul>
</div>