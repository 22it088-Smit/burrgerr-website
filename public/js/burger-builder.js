// Burger Builder JavaScript with ES6 and Higher-Order Functions

class BurgerBuilder {
    constructor() {
      this.selectedIngredients = [];
      this.basePrice = 50;
      this.totalPrice = this.basePrice;
      this.init();
    }
  
    init() {
      this.bindEvents();
      this.updateDisplay();
    }
  
    // Higher-order function for event binding
    bindEvents() {
      const checkboxes = document.querySelectorAll('.ingredient-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', this.handleIngredientChange.bind(this));
      });
  
      document.getElementById('addToCartBtn').addEventListener('click', this.addToCart.bind(this));
      document.getElementById('resetBtn').addEventListener('click', this.reset.bind(this));
      document.getElementById('quantity').addEventListener('change', this.updateDisplay.bind(this));
    }
  
    // Handle ingredient selection using array methods
    handleIngredientChange(event) {
      const checkbox = event.target;
      const ingredientData = {
        id: checkbox.dataset.ingredientId,
        name: checkbox.dataset.ingredientName,
        price: parseFloat(checkbox.dataset.ingredientPrice),
        category: checkbox.dataset.ingredientCategory,
        isVeg: checkbox.dataset.isVeg === 'true',
        isVegan: checkbox.dataset.isVegan === 'true'
      };
  
      if (checkbox.checked) {
        this.selectedIngredients.push(ingredientData);
      } else {
        this.selectedIngredients = this.selectedIngredients.filter(
          ingredient => ingredient.id !== ingredientData.id
        );
      }
  
      this.updateDisplay();
    }
  
    // Calculate prices using array reduce
    calculatePrices() {
      const ingredientsPrice = this.selectedIngredients.reduce((total, ingredient) => {
        return total + ingredient.price;
      }, 0);
  
      const quantity = parseInt(document.getElementById('quantity').value);
      const subtotal = (this.basePrice + ingredientsPrice) * quantity;
  
      return {
        ingredientsPrice,
        subtotal,
        quantity
      };
    }
  
    // Update all displays
    updateDisplay() {
      this.updatePriceDisplay();
      this.updateIngredientsList();
      this.updateBurgerPreview();
      this.updateDietaryInfo();
      this.updateAddToCartButton();
    }
  
    updatePriceDisplay() {
      const { ingredientsPrice, subtotal } = this.calculatePrices();
      
      document.getElementById('ingredientsPrice').textContent = `₹${ingredientsPrice.toFixed(2)}`;
      document.getElementById('totalPrice').textContent = `₹${subtotal.toFixed(2)}`;
    }
  
    // DOM manipulation for ingredients list
    updateIngredientsList() {
      const listContainer = document.getElementById('selectedIngredientsList');
      
      if (this.selectedIngredients.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 text-sm">No ingredients selected</p>';
        return;
      }
  
      // Group ingredients by category using array reduce
      const groupedIngredients = this.selectedIngredients.reduce((groups, ingredient) => {
        const category = ingredient.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(ingredient);
        return groups;
      }, {});
  
      const listHTML = Object.keys(groupedIngredients).map(category => {
        const ingredients = groupedIngredients[category];
        const ingredientNames = ingredients.map(ing => ing.name).join(', ');
        
        return `
          <div class="mb-2">
            <span class="font-medium text-sm capitalize">${category}:</span>
            <span class="text-sm text-gray-600">${ingredientNames}</span>
          </div>
        `;
      }).join('');
  
      listContainer.innerHTML = listHTML;
    }
  
    // Update burger visual preview
    updateBurgerPreview() {
      const burgerStack = document.getElementById('burgerStack');
      const topBun = burgerStack.querySelector('.top-bun');
      const bottomBun = burgerStack.querySelector('.bottom-bun');
  
      // Remove existing ingredient layers
      const existingLayers = burgerStack.querySelectorAll('.ingredient-layer');
      existingLayers.forEach(layer => layer.remove());
  
      // Add ingredient layers in order
      const orderedIngredients = this.orderIngredients(this.selectedIngredients);
      
      orderedIngredients.forEach((ingredient, index) => {
        const layer = document.createElement('div');
        layer.className = 'burger-layer ingredient-layer';
        layer.innerHTML = `<img src="/images/ingredients/${ingredient.name.toLowerCase().replace(/\s+/g, '-')}.png" 
                                alt="${ingredient.name}" class="w-full" 
                                onerror="this.src='/images/ingredients/default.png'">`;
        
        burgerStack.insertBefore(layer, bottomBun);
      });
    }
  
    // Order ingredients for proper burger stacking
    orderIngredients(ingredients) {
      const order = ['sauce', 'cheese', 'vegetable', 'protein'];
      
      return ingredients.sort((a, b) => {
        const aIndex = order.indexOf(a.category);
        const bIndex = order.indexOf(b.category);
        return aIndex - bIndex;
      });
    }
  
    // Update dietary information using array methods
    updateDietaryInfo() {
      const dietaryContainer = document.getElementById('dietaryInfo');
      const badges = dietaryContainer.querySelectorAll('.dietary-badge');
      
      // Hide all badges first
      badges.forEach(badge => badge.classList.add('hidden'));
  
      if (this.selectedIngredients.length === 0) {
        return;
      }
  
      // Check dietary properties using array methods
      const isVegan = this.selectedIngredients.every(ingredient => ingredient.isVegan);
      const isVegetarian = this.selectedIngredients.every(ingredient => ingredient.isVeg);
      const hasNonVeg = this.selectedIngredients.some(ingredient => !ingredient.isVeg);
  
      if (isVegan) {
        dietaryContainer.querySelector('.vegan').classList.remove('hidden');
      } else if (isVegetarian) {
        dietaryContainer.querySelector('.vegetarian').classList.remove('hidden');
      } else if (hasNonVeg) {
        dietaryContainer.querySelector('.non-veg').classList.remove('hidden');
      }
    }
  
    updateAddToCartButton() {
      const addButton = document.getElementById('addToCartBtn');
      const hasIngredients = this.selectedIngredients.length > 0;
      
      addButton.disabled = !hasIngredients;
      addButton.classList.toggle('opacity-50', !hasIngredients);
      addButton.classList.toggle('cursor-not-allowed', !hasIngredients);
    }
  
    // Add custom burger to cart
    addToCart() {
      if (this.selectedIngredients.length === 0) {
        showNotification('Please select at least one ingredient', 'error');
        return;
      }
  
      const burgerName = document.getElementById('burgerName').value || 'My Custom Burger';
      const quantity = parseInt(document.getElementById('quantity').value);
      const { subtotal } = this.calculatePrices();
      const unitPrice = subtotal / quantity;
  
      const customBurger = {
        id: `custom-${Date.now()}`,
        name: burgerName,
        price: unitPrice,
        quantity: quantity,
        image: '/images/custom-burger.png',
        customizations: this.selectedIngredients.map(ing => ing.name),
        isCustom: true,
        ingredients: this.selectedIngredients.map(ing => ing.id)
      };
  
      // Add to cart using cart manager
      if (window.cartManager) {
        window.cartManager.addItem(customBurger.id, customBurger);
        showNotification(`${burgerName} added to cart!`, 'success');
      } else {
        // Fallback if cart manager not available
        let cart = JSON.parse(localStorage.getItem('burrrgerr_cart')) || [];
        cart.push(customBurger);
        localStorage.setItem('burrrgerr_cart', JSON.stringify(cart));
        showNotification(`${burgerName} added to cart!`, 'success');
      }
    }
  
    // Reset builder
    reset() {
      // Uncheck all checkboxes
      const checkboxes = document.querySelectorAll('.ingredient-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
  
      // Reset data
      this.selectedIngredients = [];
      
      // Reset form fields
      document.getElementById('burgerName').value = '';
      document.getElementById('quantity').value = '1';
  
      // Update display
      this.updateDisplay();
  
      showNotification('Burger builder reset', 'info');
    }
  }
  
  // Initialize burger builder when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new BurgerBuilder();
  });