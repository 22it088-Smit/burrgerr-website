// ES6 compatible main JavaScript file with DOM manipulation and higher-order functions

class BurrrgerrApp {
    constructor() {
      this.cart = JSON.parse(localStorage.getItem('cart')) || [];
      this.init();
    }
  
    init() {
      this.bindEvents();
      this.updateCartCount();
      this.initializeComponents();
    }
  
    // Higher-order function for event binding
    bindEvents() {
      document.addEventListener('DOMContentLoaded', () => {
        // Add to cart buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
          button.addEventListener('click', this.handleAddToCart.bind(this));
        });
  
        // Cart operations
        const cartButtons = document.querySelectorAll('.cart-operation');
        cartButtons.forEach(button => {
          button.addEventListener('click', this.handleCartOperation.bind(this));
        });
  
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }
  
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
          button.addEventListener('click', this.handleFilter.bind(this));
        });
      });
    }
  
    // Higher-order function for debouncing
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  
    // Array manipulation for cart operations
    handleAddToCart(event) {
      event.preventDefault();
      const button = event.target;
      const burgerId = button.dataset.burgerId;
      const burgerName = button.dataset.burgerName;
      const burgerPrice = parseFloat(button.dataset.burgerPrice);
  
      const existingItem = this.cart.find(item => item.id === burgerId);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        this.cart.push({
          id: burgerId,
          name: burgerName,
          price: burgerPrice,
          quantity: 1
        });
      }
  
      this.updateCart();
      this.showNotification(`${burgerName} added to cart!`, 'success');
    }
  
    handleCartOperation(event) {
      const button = event.target;
      const operation = button.dataset.operation;
      const itemId = button.dataset.itemId;
  
      switch (operation) {
        case 'increase':
          this.increaseQuantity(itemId);
          break;
        case 'decrease':
          this.decreaseQuantity(itemId);
          break;
        case 'remove':
          this.removeItem(itemId);
          break;
      }
    }
  
    // Array methods for cart manipulation
    increaseQuantity(itemId) {
      const item = this.cart.find(item => item.id === itemId);
      if (item) {
        item.quantity += 1;
        this.updateCart();
      }
    }
  
    decreaseQuantity(itemId) {
      const item = this.cart.find(item => item.id === itemId);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        this.updateCart();
      }
    }
  
    removeItem(itemId) {
      this.cart = this.cart.filter(item => item.id !== itemId);
      this.updateCart();
      this.renderCartItems();
    }
  
    updateCart() {
      localStorage.setItem('cart', JSON.stringify(this.cart));
      this.updateCartCount();
      this.updateCartTotal();
    }
  
    updateCartCount() {
      const cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
      const cartCountElements = document.querySelectorAll('.cart-count');
      cartCountElements.forEach(element => {
        element.textContent = cartCount;
        element.style.display = cartCount > 0 ? 'inline' : 'none';
      });
    }
  
    updateCartTotal() {
      const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalElements = document.querySelectorAll('.cart-total');
      totalElements.forEach(element => {
        element.textContent = `₹${total.toFixed(2)}`;
      });
    }
  
    // DOM manipulation for search
    handleSearch(event) {
      const searchTerm = event.target.value.toLowerCase();
      const burgerCards = document.querySelectorAll('.burger-card');
      
      burgerCards.forEach(card => {
        const burgerName = card.querySelector('.burger-name').textContent.toLowerCase();
        const burgerDescription = card.querySelector('.burger-description').textContent.toLowerCase();
        
        if (burgerName.includes(searchTerm) || burgerDescription.includes(searchTerm)) {
          card.style.display = 'block';
          card.classList.add('fade-in');
        } else {
          card.style.display = 'none';
          card.classList.remove('fade-in');
        }
      });
    }
  
    // Filter functionality using array methods
    handleFilter(event) {
      const filterValue = event.target.dataset.filter;
      const burgerCards = document.querySelectorAll('.burger-card');
      
      // Remove active class from all filter buttons
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      burgerCards.forEach(card => {
        const category = card.dataset.category;
        
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'block';
          card.classList.add('fade-in');
        } else {
          card.style.display = 'none';
          card.classList.remove('fade-in');
        }
      });
    }
  
    // Render cart items with DOM manipulation
    renderCartItems() {
      const cartContainer = document.getElementById('cartItems');
      if (!cartContainer) return;
  
      if (this.cart.length === 0) {
        cartContainer.innerHTML = '<p class="text-center text-gray-500">Your cart is empty</p>';
        return;
      }
  
      const cartHTML = this.cart.map(item => `
        <div class="cart-item flex justify-between items-center p-4 border-b">
          <div>
            <h4 class="font-semibold">${item.name}</h4>
            <p class="text-gray-600">₹${item.price}</p>
          </div>
          <div class="flex items-center space-x-2">
            <button class="cart-operation btn-sm" data-operation="decrease" data-item-id="${item.id}">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="cart-operation btn-sm" data-operation="increase" data-item-id="${item.id}">+</button>
            <button class="cart-operation btn-danger btn-sm ml-2" data-operation="remove" data-item-id="${item.id}">Remove</button>
          </div>
        </div>
      `).join('');
  
      cartContainer.innerHTML = cartHTML;
    }
  
    // Notification system
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type} fixed top-4 right-4 p-4 rounded shadow-lg z-50`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }
  
    // Initialize other components
    initializeComponents() {
      this.renderCartItems();
      this.initializeAnimations();
    }
  
    // Animation initialization
    initializeAnimations() {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };
  
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      }, observerOptions);
  
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }
  }
  
  // Initialize the app
  const app = new BurrrgerrApp();
  
  // Export for use in other modules
  window.BurrrgerrApp = BurrrgerrApp;