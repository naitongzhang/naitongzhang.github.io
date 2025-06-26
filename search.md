---
layout: page
title: Search
permalink: /search/
---

Suggested: #Dubai Financial Market #Dubai Real Estate

<div id="search-container">
  <input type="text" id="search-input" placeholder="Search for posts and artworks...">
  <ul id="results-container"></ul>
</div>

<!-- Include the search script from a CDN -->
<script src="https://unpkg.com/simple-jekyll-search@1.10.0/dest/simple-jekyll-search.min.js"></script>

<script>
  SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),
    resultsContainer: document.getElementById('results-container'),
    json: '{{ "/search.json" | relative_url }}',
    searchResultTemplate: '<li><a href="{url}">{title}</a></li>',
    noResultsText: 'No results found',
  });
</script>