module Jekyll
  class CategoryTagPageGenerator < Generator
    safe true

    def generate(site)
      # Generate category pages
      site.categories.each do |category_name, posts|
        site.pages << CategoryTagPage.new(site, site.source, "category", category_name, posts)
      end

      # Generate tag pages
      site.tags.each do |tag_name, posts|
        site.pages << CategoryTagPage.new(site, site.source, "tag", tag_name, posts)
      end
    end
  end

  class CategoryTagPage < Page
    def initialize(site, base, type, name, posts)
      @site = site
      @base = base
      # Determine the directory for the generated page (e.g., /categories/ or /tags/)
      @dir  = type == "category" ? "categories" : "tags"
      # The filename for the generated page (e.g., painting.html, blue.html)
      @name = "#{site.slugify(name)}.html"

      self.process(@name)
      # Use the 'category_tag_listing.html' layout for these pages
      self.read_yaml(File.join(base, '_layouts'), 'category_tag_listing.html')

      self.data['title'] = name.capitalize # Page title (e.g., "Painting")
      self.data['category_or_tag_name'] = name # Pass the original name to the layout
      self.data['posts'] = posts # Pass the associated posts/artworks to the layout
      # Set the permalink based on config or default (e.g., /categories/painting/)
      self.data['permalink'] = site.config["#{type}_permalink"].gsub(':name', site.slugify(name)) rescue "/#{@dir}/#{site.slugify(name)}/"
    end
  end
end