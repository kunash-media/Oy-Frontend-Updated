/* SEARCH SUGGESTIONS */
// Sample product data mapped to your HTML pages
const products = [
  { name: "Diamond Ring", url: "/rings.html" },
  { name: "Gold Ring", url: "/rings.html" },
  { name: "Silver Ring", url: "/rings.html" },
  { name: "Gold Necklace", url: "/neck.html" },
  { name: "Silver Necklace", url: "/neck.html" },
  { name: "Pearl Necklace", url: "/neck.html" },
  { name: "Silver Bracelet", url: "/bracelet.html" },
  { name: "Gold Bracelet", url: "/bracelet.html" },
  { name: "Pearl Earrings", url: "/earrings.html" },
  { name: "Diamond Earrings", url: "/earring.html" }
];

const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

searchInput.addEventListener('input', function() {
  const input = this.value.toLowerCase();
  searchSuggestions.innerHTML = '';
  
  if (input.length > 0) {
    const matches = products.filter(product => 
      product.name.toLowerCase().includes(input)
    );
    
    if (matches.length > 0) {
      matches.forEach(product => {
        const suggestion = document.createElement('a');
        suggestion.href = product.url;
        suggestion.textContent = product.name;
        suggestion.className = 'suggestion-item';
        searchSuggestions.appendChild(suggestion);
      });
      searchSuggestions.style.display = 'block';
    } else {
      searchSuggestions.style.display = 'none';
    }
  } else {
    searchSuggestions.style.display = 'none';
  }
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(e) {
  if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
    searchSuggestions.style.display = 'none';
  }
});
