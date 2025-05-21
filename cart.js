// Use event delegation for add-to-cart buttons
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('add-to-cart')) {
      const button = event.target;
      const product = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image,
        quantity: 1
      };
      
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      
      // Check if product already in cart
      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push(product);
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      
      // Optional: Show confirmation
      alert(`${product.name} added to cart!`);
    }
  });
  
  // Update cart count display
  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCountElements = document.querySelectorAll('#cart-count');
    cartCountElements.forEach(element => {
      element.textContent = cart.length;
    });
  }
  
  // Initialize cart count on page load
  document.addEventListener('DOMContentLoaded', updateCartCount);



  // Cart functionality
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const cartIcon = document.querySelector('.cart-icon');
  const cartPopup = document.querySelector('.cart-popup');
  const cartOverlay = document.querySelector('.cart-overlay');
  const closeCart = document.querySelector('.close-cart');
  const cartItemsContainer = document.querySelector('.cart-items');
  const cartCount = document.querySelector('.cart-count');
  const cartTotal = document.querySelector('.cart-total');
  
  // Initialize cart from localStorage
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Toggle cart visibility
if (cartIcon) cartIcon.addEventListener('click', toggleCart);
if (closeCart) closeCart.addEventListener('click', toggleCart);

  
  function toggleCart() {
    document.body.classList.toggle('cart-open');
    if (document.body.classList.contains('cart-open')) {
      renderCartItems();
    }
  }
  
  // Add to cart functionality
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const product = {
        id: this.dataset.id,
        name: this.dataset.name,
        price: parseFloat(this.dataset.price),
        image: this.dataset.image
      };
      
      addToCart(product);
      
      // Visual feedback
      this.classList.add('added');
      this.textContent = 'Added!';
      setTimeout(() => {
        this.classList.remove('added');
        this.textContent = 'Add to Cart';
      }, 1000);
    });
  });
  
  // Add item to cart
  function addToCart(product) {
    // Check if item already exists
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      product.quantity = 1;
      cart.push(product);
    }
    
    updateCart();
  }
  
  // Update cart in storage and UI
  function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
  }
  
  // Update cart count badge
 // Update cart count badge
function updateCartCount() {
  const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  if (cartCount) {
    cartCount.textContent = count;
  }
}

  
  // Render cart items
  function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
      cartTotal.textContent = '0.00';
      return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
      total += item.price * (item.quantity || 1);
      
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.name}</h4>
          <p class="cart-item-price">$${item.price} x ${item.quantity || 1}</p>
          <p class="cart-item-remove" data-id="${item.id}">Remove</p>
        </div>
      `;
      cartItemsContainer.appendChild(cartItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.dataset.id;
        removeFromCart(id);
      });
    });
    
    cartTotal.textContent = total.toFixed(2);
  }
  
  // Remove item from cart
  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
  }
  
  // Initialize cart count on page load
  updateCartCount();
});


document.addEventListener("DOMContentLoaded", () => {
  const clearCartButton = document.getElementById("clear-cart");
  if (clearCartButton) {
    clearCartButton.addEventListener("click", () => {
      localStorage.removeItem("cart");
      location.reload(); // Refresh the page to update the cart display
    });
  }
});

