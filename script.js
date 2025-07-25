// Initialize cart items and cart count
let cartItems = [];
let cartCount = 1;

// Update the count for Cart
function updateCartCount() {
  const cart = loadCart();
  const countElement = document.getElementById("cart-count");
  if (countElement) {
    countElement.textContent = cart.length;
  }
}

// Open the Cart modal
function openCart() {
  const modal = document.getElementById("cart-modal");
  modal.style.display = "block";
  displayCartItems();
}

// Close the Cart modal
function closeCart() {
  const modal = document.getElementById("cart-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Cart management functions
function loadCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Display cart items in modal/table
function displayCartItems() {
  const cart = loadCart();
  const tableBody = document.querySelector('#cart-table tbody');
  const totalDisplay = document.getElementById('cart-total');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>
        <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
      </td>
      <td>$${subtotal.toFixed(2)}</td>
      <td><i class="fa fa-trash remove-btn" onclick="removeItem(${index})"></i></td>
    `;
    tableBody.appendChild(row);
  });

  if (totalDisplay) {
    totalDisplay.textContent = total.toFixed(2);
  }
}

function updateQuantity(index, newQty) {
  let cart = loadCart();
  cart[index].quantity = parseInt(newQty);
  saveCart(cart);
  displayCartItems();
}

function removeItem(index) {
  let cart = loadCart();
  cart.splice(index, 1);
  saveCart(cart);
  displayCartItems();
}

function addToCart(product) {
  const cart = loadCart();
  cart.push(product);
  saveCart(cart);
  updateCartCount();
  alert(`${product.title} added to cart!`);
}

// Main DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
  // Load cart on page load
  displayCartItems();
  updateCartCount();
  
  // Confirmation display
  const confirmation = document.getElementById('confirmation');
  if (confirmation) {
    confirmation.style.display = 'block';
    confirmation.style.animation = 'fadeIn 0.6s ease';
  }

  // Add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      const product = {
        id: card.dataset.id,
        title: card.dataset.title,
        price: parseFloat(card.dataset.price)
      };
      addToCart(product);
    });
  });

  // Buy Now Logic
  document.querySelectorAll('.buy-now').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      const product = {
        id: card.dataset.id,
        title: card.dataset.title,
        price: parseFloat(card.dataset.price)
      };

      // Store single item in checkout session (temporary)
      localStorage.setItem('buyNowItem', JSON.stringify(product));

      // Redirect to checkout page
      window.location.href = 'checkout.html';
    });
  });

  // Hamburger menu functionality
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
  } else {
    console.warn('hamburger or navLinks not found in the DOM');
  }

  // Wishlist functionality
  const wishlistIcons = document.querySelectorAll('.wishlist-icon');
  
  wishlistIcons.forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const id = this.getAttribute('data-id');
      const name = this.getAttribute('data-name');
      const price = this.getAttribute('data-price');
      const image = this.getAttribute('data-image');
      
      addToWishlist(id, name, price, image);
      this.classList.toggle('active');
    });
  });
  
  // Update wishlist count in header
  updateWishlistCount();
});

/* FRONT POPUP */
function closePopup() {
  const popup = document.getElementById("offerPopup");
  if (popup) {
    popup.style.display = "none";
    popup.classList.remove('active');
  }
}

// Always show popup on home load
window.onload = function() {
  const popup = document.getElementById("offerPopup");
  if (popup) {
    popup.style.display = "flex";
  }
};

window.addEventListener('load', () => {
  const popup = document.getElementById('offerPopup');
  if (popup) {
    popup.classList.add('active');  // triggers fade + scale animation
  }
});

/* SEARCH SUGGESTIONS */
// Sample product data mapped to your HTML pages
const products = [
  { name: "Diamond Ring", url: "rings.html" },
  { name: "Gold Ring", url: "rings.html" },
  { name: "Silver Ring", url: "rings.html" },
  { name: "Gold Necklace", url: "neck.html" },
  { name: "Silver Necklace", url: "neck.html" },
  { name: "Pearl Necklace", url: "neck.html" },
  { name: "Silver Bracelet", url: "bracelet.html" },
  { name: "Gold Bracelet", url: "bracelet.html" },
  { name: "Pearl Earrings", url: "earrings.html" },
  { name: "Diamond Earrings", url: "earring.html" }
];

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

if (searchInput && searchSuggestions) {
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
}

// Hide suggestions when clicking outside
document.addEventListener('click', function(e) {
  if (searchInput && searchSuggestions && 
      !searchInput.contains(e.target) && 
      !searchSuggestions.contains(e.target)) {
    searchSuggestions.style.display = 'none';
  }
});

// Wishlist functions
function addToWishlist(id, name, price, image) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  
  // Check if item already exists in wishlist
  const existingIndex = wishlist.findIndex(item => item.id === id);
  
  if (existingIndex !== -1) {
    // Remove from wishlist if already exists
    wishlist.splice(existingIndex, 1);
  } else {
    // Add to wishlist
    wishlist.push({
      id: id,
      name: name,
      price: price,
      image: image
    });
  }
  
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
  
  // Show feedback
  const feedback = existingIndex !== -1 ? 
    `${name} removed from wishlist` : 
    `${name} added to wishlist`;
  
  // You can replace this with a nicer notification
  alert(feedback);
}

function updateWishlistCount() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const count = wishlist.length;
  
  // Update wishlist count in header
  const wishlistCountElements = document.querySelectorAll('.wishlist-count');
  if (wishlistCountElements) {
    wishlistCountElements.forEach(el => {
      el.textContent = count;
    });
  }
}