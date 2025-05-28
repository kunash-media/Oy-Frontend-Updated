// Initialize cart items and cart count
let cartItems = [];
let cartCount = 1;

// Update the count for Cart
function updateCartCount() {
  document.getElementById("cart-count").innerText = cartCount;
}

// Open the Cart modal
function openCart() {
  const modal = document.getElementById("cart-modal");
  modal.style.display = "block";
  displayCartItems();
}

// Close the Cart modal
function closeCart() {
 
}



document.addEventListener('DOMContentLoaded', loadCart);

function loadCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const tableBody = document.querySelector('#cart-table tbody');
  const totalDisplay = document.getElementById('cart-total');
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

  totalDisplay.textContent = total.toFixed(2);
}

function updateQuantity(index, newQty) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart[index].quantity = parseInt(newQty);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

function removeItem(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

document.addEventListener("DOMContentLoaded", () => {
  const confirmation = document.getElementById('confirmation');
  if (confirmation) {
    confirmation.style.display = 'block';
    confirmation.style.animation = 'fadeIn 0.6s ease';
  }
});

function loadCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
  }

  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function updateCartCount() {
    const cart = loadCart();
    document.getElementById('cart-count').textContent = cart.length;
  }

  function addToCart(product) {
    const cart = loadCart();
    cart.push(product);
    saveCart(cart);
    updateCartCount();
    alert(`${product.title} added to cart!`);
  }

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

  // Initialize cart count on load
  updateCartCount();




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





    /*document.addEventListener("DOMContentLoaded", function () {
  const slider = document.getElementById("slider");
  const slides = document.querySelectorAll(".slide");
  const totalSlides = slides.length;
  let currentIndex = 0;

  function moveToNextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  setInterval(moveToNextSlide, 3000);
});









    let slideIndex = 0;
         showSlides();
         
         function showSlides() {
           let i;
           let slides = document.getElementsByClassName("mySlides");
           let dots = document.getElementsByClassName("dot");
           for (i = 0; i < slides.length; i++) {
             slides[i].style.display = "none";  
           }
           slideIndex++;
           if (slideIndex > slides.length) {slideIndex = 1}    
           for (i = 0; i < dots.length; i++) {
             dots[i].className = dots[i].className.replace(" active", "");
           }
           slides[slideIndex-1].style.display = "block";  
           dots[slideIndex-1].className += " active";
           setTimeout(showSlides, 2000); // Change image every 2 seconds
         }*/


document.addEventListener('DOMContentLoaded', function () {
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
});


/* FRONT POPUP */

function closePopup() {
  document.getElementById("offerPopup").style.display = "none";
}

// Always show popup on home load
window.onload = function() {
  document.getElementById("offerPopup").style.display = "flex";
};
window.addEventListener('load', () => {
  const popup = document.getElementById('offerPopup');
  popup.classList.add('active');  // triggers fade + scale animation
});

function closePopup() {
  const popup = document.getElementById('offerPopup');
  popup.classList.remove('active');
}









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

















// Add this to your JavaScript
document.addEventListener('DOMContentLoaded', function() {
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