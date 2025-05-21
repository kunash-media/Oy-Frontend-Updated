// search.js - reusable search functionality
class JewelrySearch {
  constructor() {
    this.products = [
      "Gold Necklace", "Silver Ring", "Diamond Earrings",
      "Pearl Bracelet", "Platinum Band", "Rose Gold Pendant",
      "Sapphire Ring", "Emerald Necklace", "Ruby Bracelet",
      "Diamond Ring", "Charm Bracelet", "Hoop Earrings"
    ];
    this.initSearchBars();
  }

  initSearchBars() {
    document.querySelectorAll('.search-bar').forEach(bar => {
      const input = bar.querySelector('input');
      const suggestions = bar.querySelector('.search-suggestions');
      const button = bar.querySelector('button');
      
      // Debounce input handler
      const handleInput = this.debounce(() => {
        this.showSuggestions(input, suggestions);
      }, 200);
      
      input.addEventListener('input', handleInput);
      
      // Handle suggestion click
      suggestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-suggestion-item')) {
          input.value = e.target.textContent;
          suggestions.style.display = 'none';
          this.submitSearch(input.value);
        }
      });
      
      // Handle search button
      button.addEventListener('click', () => {
        this.submitSearch(input.value);
      });
      
      // Handle Enter key
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.submitSearch(input.value);
        }
      });
    });
  }

  showSuggestions(input, container) {
    const value = input.value.toLowerCase().trim();
    container.innerHTML = '';
    
    if (value.length > 0) {
      const filtered = this.products.filter(p => 
        p.toLowerCase().includes(value)
      );
      
      if (filtered.length > 0) {
        filtered.forEach(product => {
          const div = document.createElement('div');
          div.className = 'search-suggestion-item';
          div.textContent = product;
          container.appendChild(div);
        });
        container.style.display = 'block';
      } else {
        const div = document.createElement('div');
        div.className = 'search-suggestion-item no-results';
        div.textContent = 'No results found';
        container.appendChild(div);
        container.style.display = 'block';
      }
    } else {
      container.style.display = 'none';
    }
  }

  submitSearch(term) {
    // Save search term in session storage for cross-page consistency
    sessionStorage.setItem('lastSearch', term);
    
    // Implement your actual search navigation here
    console.log('Searching for:', term);
    // window.location.href = `/search-results?q=${encodeURIComponent(term)}`;
  }

  debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new JewelrySearch();
});