---
title: Search
layout: page
---

<h1>Search</h1>

<input type="text" id="search-input" placeholder="Type to search...">
<ul id="search-results"></ul>

<script src="{{ '/assets/js/lunr.min.js' | relative_url }}"></script>
<script>
(function() {
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchIndex; // Will hold the Lunr.js index
  var pages = []; // Will hold the raw page data (for displaying results)

  // Fetch the search index
  fetch('{{ "/search.json" | relative_url }}')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      pages = data;
      searchIndex = lunr(function () {
        this.ref('url'); // Unique identifier for each document
        this.field('title', { boost: 10 }); // Boost title matches
        this.field('content');
        this.field('categories');
        this.field('tags');

        pages.forEach(function (page) {
          this.add(page);
        }, this);
      });
    })
    .catch(error => {
      console.error('Error fetching search index:', error);
      searchResults.innerHTML = '<li>Error loading search. Please try again later.</li>';
    });

  // Handle search input
  searchInput.addEventListener('keyup', function() {
    var query = this.value;
    searchResults.innerHTML = ''; // Clear previous results

    if (query.length < 2) { // Require at least 2 characters for search
      return;
    }

    var results = searchIndex.search(query); // Perform the search

    if (results.length === 0) {
      searchResults.innerHTML = '<li>No results found for "' + query + '".</li>';
      return;
    }

    results.forEach(function(result) {
      var page = pages.find(p => p.url === result.ref); // Find the original page data
      if (page) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = page.url;
        a.textContent = page.title;
        li.appendChild(a);
        searchResults.appendChild(li);
      }
    });
  });
})();
</script>