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


// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.nav-links a');

// Toggle navigation menu visibility
hamburger.addEventListener('click', () => {
  mainNav.classList.toggle('active'); // Toggle the 'active' class to show or hide the menu
});

// Close the hamburger menu when a link is clicked
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('active'); // Remove the 'active' class to hide the menu
  });
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
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');
  
  // Sample jewelry products data
  const jewelryProducts = [
    "Gold Necklace", "Silver Ring", "Diamond Earrings", 
    "Pearl Bracelet", "Platinum Band", "Rose Gold Pendant",
    "Sapphire Ring", "Emerald Necklace", "Ruby Bracelet",
    "Diamond Ring", "Charm Bracelet", "Hoop Earrings"
  ];
  
  // Debounce function to limit how often search runs
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  const handleSearchInput = debounce(function() {
    const inputValue = this.value.toLowerCase().trim();
    searchSuggestions.innerHTML = '';
    
    if (inputValue.length > 0) {
      const filteredProducts = jewelryProducts.filter(product => 
        product.toLowerCase().includes(inputValue)
      );
      
      if (filteredProducts.length > 0) {
        filteredProducts.forEach(product => {
          const suggestionItem = document.createElement('div');
          suggestionItem.classList.add('search-suggestion-item');
          suggestionItem.textContent = product;
          suggestionItem.addEventListener('click', function() {
            searchInput.value = product;
            searchSuggestions.style.display = 'none';
            // Submit search or navigate to product
            // document.querySelector('.search-bar').submit();
          });
          searchSuggestions.appendChild(suggestionItem);
        });
        searchSuggestions.style.display = 'block';
      } else {
        const noResults = document.createElement('div');
        noResults.classList.add('search-suggestion-item');
        noResults.textContent = 'No results found';
        searchSuggestions.appendChild(noResults);
        searchSuggestions.style.display = 'block';
      }
    } else {
      searchSuggestions.style.display = 'none';
    }
  }, 200); // 200ms delay
  
  searchInput.addEventListener('input', handleSearchInput);
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
      searchSuggestions.style.display = 'none';
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    // Adjust suggestion width if needed
    if (searchSuggestions.style.display === 'block') {
      searchSuggestions.style.width = searchInput.offsetWidth + 'px';
    }
  });
});