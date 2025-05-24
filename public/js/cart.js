// ES6 Cart management with higher-order functions and array manipulation

class CartManager {
    constructor() {
      this.cart = JSON.parse(localStorage.getItem('burrrgerr_cart')) || [];
      this.discountCodes = ['FIRST10', 'BURGER20', 'STUDENT15'];
      this.appliedDiscount = null;
    }
  
    // Higher-order function for cart operations
    cartOperation(operation) {
      return (itemId, data = {}) => {
        switch (operation) {
          case 'add':
            return this.addItem(itemId, data);
          case 'update':
            return this.updateQuantity(itemId, data.quantity);
          case 'remove':
            return this.removeItem(itemId);
          case 'clear':
            return this.clearCart();
        }
      };
    }
  
    addItem(burgerId, burgerData) {
      const existingItem = this.cart.find(item => item.id === burgerId);
      
      if (existingItem) {
        existingItem.quantity += burgerData.quantity || 1;
      } else {
        this.cart.push({
          id: burgerId,
          name: burgerData.name,
          price: burgerData.price,
          quantity: burgerData.quantity || 1,
          image: burgerData.image,
          customizations: burgerData.customizations || []
        });
      }
      
      this.saveCart();
      this.updateCartDisplay();
      return true;
    }
  
    updateQuantity(itemId, newQuantity) {
      const item = this.cart.find(item => item.id === itemId);
      if (item) {
        if (newQuantity <= 0) {
          this.removeItem(itemId);
        } else {
          item.quantity = newQuantity;
          this.saveCart();
          this.updateCartDisplay();
        }
        return true;
      }
      return false;
    }
  
    removeItem(itemId) {
      this.cart = this.cart.filter(item => item.id !== itemId);
      this.saveCart();
      this.updateCartDisplay();
      return true;
    }
  
    clearCart() {
      this.cart = [];
      this.appliedDiscount = null;
      this.saveCart();
      this.updateCartDisplay();
    }
  
    // Array methods for calculations
    getSubtotal() {
      return this.cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
  
    getDiscountAmount() {
      if (!this.appliedDiscount) return 0;
      
      const subtotal = this.getSubtotal();
      const discountPercentage = parseInt(this.appliedDiscount.replace(/\D/g, ''));
      return (subtotal * discountPercentage) / 100;
    }
  
    getTotalAmount() {
      const subtotal = this.getSubtotal();
      const discount = this.getDiscountAmount();
      const deliveryFee = subtotal > 500 ? 0 : 40; // Free delivery above ₹500
      
      return subtotal - discount + deliveryFee;
    }
  
    // Discount code validation using array methods
    applyDiscountCode(code) {
      const validCode = this.discountCodes.find(validCode => 
        validCode.toLowerCase() === code.toLowerCase()
      );
      
      if (validCode) {
        this.appliedDiscount = validCode;
        this.updateCartDisplay();
        return { success: true, message: 'Discount applied successfully!' };
      }
      
      return { success: false, message: 'Invalid discount code' };
    }
  
    removeDiscountCode() {
      this.appliedDiscount = null;
      this.updateCartDisplay();
    }
  
    saveCart() {
      localStorage.setItem('burrrgerr_cart', JSON.stringify(this.cart));
    }
  
    // DOM manipulation for cart display
    updateCartDisplay() {
      this.updateCartCount();
      this.updateCartSidebar();
      this.updateCartPage();
      this.updateCheckoutSummary();
    }
  
    updateCartCount() {
      const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
      const cartCountElements = document.querySelectorAll('.cart-count');
      
      cartCountElements.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'inline-block' : 'none';
      });
    }
  
    updateCartSidebar() {
      const cartSidebar = document.getElementById('cartSidebar');
      if (!cartSidebar) return;
  
      const cartItemsContainer = cartSidebar.querySelector('.cart-items');
      const cartTotal = cartSidebar.querySelector('.cart-total');
  
      if (this.cart.length === 0) {
        cartItemsContainer.innerHTML = `
          <div class="text-center py-8">
            <p class="text-gray-500">Your cart is empty</p>
            <button class="btn btn-primary mt-4" onclick="closeSidebar()">Continue Shopping</button>
          </div>
        `;
        return;
      }
  
      // Render cart items using array map
      const cartHTML = this.cart.map(item => `
        <div class="cart-item flex items-center justify-between p-4 border-b" data-item-id="${item.id}">
          <div class="flex items-center space-x-3">
            <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
            <div>
              <h4 class="font-medium text-sm">${item.name}</h4>
              <p class="text-gray-600 text-xs">₹${item.price}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
            <button class="remove-btn ml-2" onclick="cartManager.removeItem('${item.id}')">×</button>
          </div>
        </div>
      `).join('');
  
      cartItemsContainer.innerHTML = cartHTML;
      cartTotal.textContent = `₹${this.getTotalAmount().toFixed(2)}`;
    }
  
    updateCartPage() {
      const cartPage = document.getElementById('cartPage');
      if (!cartPage) return;
  
      const cartContainer = cartPage.querySelector('.cart-container');
      const summaryContainer = cartPage.querySelector('.cart-summary');
  
      if (this.cart.length === 0) {
        cartContainer.innerHTML = `
          <div class="text-center py-12">
            <h2 class="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p class="text-gray-600 mb-6">Add some delicious burgers to get started!</p>
            <a href="/burgers" class="btn btn-primary">Browse Menu</a>
          </div>
        `;
        return;
      }
  
      // Render detailed cart items
      const cartHTML = this.cart.map(item => `
        <div class="cart-item-detailed bg-white rounded-lg shadow p-6 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg">
              <div>
                <h3 class="font-bold text-lg">${item.name}</h3>
                <p class="text-gray-600">₹${item.price} each</p>
                ${item.customizations.length > 0 ? `
                  <div class="text-sm text-gray-500 mt-1">
                    Customizations: ${item.customizations.join(', ')}
                  </div>
                ` : ''}
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <button class="quantity-btn-large" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <span class="quantity-large">${item.quantity}</span>
                <button class="quantity-btn-large" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
              </div>
              <div class="text-right">
                <p class="font-bold text-lg">₹${(item.price * item.quantity).toFixed(2)}</p>
                <button class="text-red-500 hover:text-red-700 text-sm" onclick="cartManager.removeItem('${item.id}')">Remove</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
  
      cartContainer.innerHTML = cartHTML;
      this.updateCartSummary(summaryContainer);
    }
  
    updateCartSummary(container) {
      if (!container) return;
  
      const subtotal = this.getSubtotal();
      const discount = this.getDiscountAmount();
      const deliveryFee = subtotal > 500 ? 0 : 40;
      const total = this.getTotalAmount();
  
      container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-bold text-lg mb-4">Order Summary</h3>
          <div class="space-y-2 mb-4">
            <div class="flex justify-between">
              <span>Subtotal</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
              <div class="flex justify-between text-green-600">
                <span>Discount (${this.appliedDiscount})</span>
                <span>-₹${discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between">
              <span>Delivery Fee</span>
              <span>${deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee}</span>
            </div>
            <hr class="my-2">
            <div class="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="mb-4">
            <input type="text" id="discountCode" placeholder="Enter discount code" class="w-full p-2 border rounded mb-2">
            <button onclick="applyDiscount()" class="btn btn-secondary w-full">Apply Discount</button>
          </div>
          
          <button onclick="proceedToCheckout()" class="btn btn-primary w-full">Proceed to Checkout</button>
        </div>
      `;
    }
  
    updateCheckoutSummary() {
      const checkoutSummary = document.getElementById('checkoutSummary');
      if (!checkoutSummary) return;
  
      const subtotal = this.getSubtotal();
      const discount = this.getDiscountAmount();
      const deliveryFee = subtotal > 500 ? 0 : 40;
      const total = this.getTotalAmount();
    }
}
    //   checkoutSummary.innerHTML = `
    //     <h3 class="font-bold text-lg mb-4">Order Summary</h3>
      