// Order Tracking JavaScript with ES6 and Real-time Updates

class OrderTracker {
    constructor(orderId) {
      this.orderId = orderId;
      this.statusSteps = ['placed', 'preparing', 'packaging', 'out-for-delivery', 'delivered'];
      this.statusLabels = {
        'placed': 'Order Placed',
        'preparing': 'Preparing',
        'packaging': 'Packaging',
        'out-for-delivery': 'Out for Delivery',
        'delivered': 'Delivered'
      };
      this.init();
    }
  
    init() {
      this.createProgressBar();
      this.startPolling();
      this.bindEvents();
    }
  
    // Create visual progress bar using DOM manipulation
    createProgressBar() {
      const progressContainer = document.getElementById('orderProgress');
      if (!progressContainer) return;
  
      const progressHTML = this.statusSteps.map((status, index) => {
        return `
          <div class="progress-step" data-status="${status}">
            <div class="progress-circle">
              <i class="fas fa-${this.getStatusIcon(status)}"></i>
            </div>
            <div class="progress-label">${this.statusLabels[status]}</div>
            ${index < this.statusSteps.length - 1 ? '<div class="progress-line"></div>' : ''}
          </div>
        `;
      }).join('');
  
      progressContainer.innerHTML = `<div class="progress-bar-container">${progressHTML}</div>`;
    }
  
    // Get icon for each status
    getStatusIcon(status) {
      const icons = {
        'placed': 'check-circle',
        'preparing': 'utensils',
        'packaging': 'box',
        'out-for-delivery': 'truck',
        'delivered': 'home'
      };
      return icons[status] || 'circle';
    }
  
    // Update progress bar based on current status
    updateProgressBar(currentStatus) {
      const currentIndex = this.statusSteps.indexOf(currentStatus);
      const steps = document.querySelectorAll('.progress-step');
  
      steps.forEach((step, index) => {
        const circle = step.querySelector('.progress-circle');
        const line = step.querySelector('.progress-line');
  
        if (index <= currentIndex) {
          step.classList.add('completed');
          circle.classList.add('active');
        } else {
          step.classList.remove('completed');
          circle.classList.remove('active');
        }
  
        if (index === currentIndex) {
          step.classList.add('current');
        } else {
          step.classList.remove('current');
        }
  
        if (line && index < currentIndex) {
          line.classList.add('completed');
        } else if (line) {
          line.classList.remove('completed');
        }
      });
    }
  
    // Poll for order updates using higher-order function
    startPolling() {
      const pollInterval = 30000; // 30 seconds
      
      const poll = () => {
        this.fetchOrderStatus()
          .then(order => {
            this.updateOrderDisplay(order);
          })
          .catch(error => {
            console.error('Error fetching order status:', error);
          });
      };
  
      // Initial fetch
      poll();
      
      // Set up polling interval
      this.pollingInterval = setInterval(poll, pollInterval);
    }
  
    // Fetch order status from API
    async fetchOrderStatus() {
      try {
        const response = await fetch(`/orders/${this.orderId}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch order status');
        }
  
        const data = await response.json();
        return data.order;
      } catch (error) {
        throw error;
      }
    }
  
    // Update order display with new data
    updateOrderDisplay(order) {
      // Update progress bar
      this.updateProgressBar(order.status);
  
      // Update status badge
      const statusBadge = document.getElementById('orderStatus');
      if (statusBadge) {
        statusBadge.textContent = this.statusLabels[order.status];
        statusBadge.className = `status-badge status-${order.status}`;
      }
  
      // Update estimated delivery time
      const deliveryTime = document.getElementById('estimatedDelivery');
      if (deliveryTime && order.estimatedDelivery) {
        const deliveryDate = new Date(order.estimatedDelivery);
        deliveryTime.textContent = deliveryDate.toLocaleString();
      }
  
      // Update order details
      this.updateOrderDetails(order);
  
      // Show notification for status changes
      if (this.lastStatus && this.lastStatus !== order.status) {
        this.showStatusChangeNotification(order.status);
      }
      this.lastStatus = order.status;
  
      // Stop polling if order is delivered or cancelled
      if (order.status === 'delivered' || order.status === 'cancelled') {
        this.stopPolling();
      }
    }
  
    // Update order details section
    updateOrderDetails(order) {
      const detailsContainer = document.getElementById('orderDetails');
      if (!detailsContainer) return;
  
      const itemsHTML = order.items.map(item => {
        if (item.burger) {
          return `
            <div class="order-item">
              <div class="item-info">
                <h4>${item.burger.name}</h4>
                <p>Quantity: ${item.quantity}</p>
              </div>
              <div class="item-price">₹${item.price.toFixed(2)}</div>
            </div>
          `;
        } else if (item.customBurger) {
          return `
            <div class="order-item">
              <div class="item-info">
                <h4>${item.customBurger.name}</h4>
                <p>Custom Burger - Quantity: ${item.quantity}</p>
                <p class="text-sm text-gray-600">
                  Ingredients: ${item.customBurger.ingredients.map(ing => ing.name).join(', ')}
                </p>
              </div>
              <div class="item-price">₹${item.price.toFixed(2)}</div>
            </div>
          `;
        }
      }).join('');
  
      detailsContainer.innerHTML = itemsHTML;
    }
  
    // Show notification for status changes
    showStatusChangeNotification(newStatus) {
      const messages = {
        'preparing': 'Your order is now being prepared! 👨‍🍳',
        'packaging': 'Your order is being packaged! 📦',
        'out-for-delivery': 'Your order is out for delivery! 🚚',
        'delivered': 'Your order has been delivered! Enjoy your meal! 🎉'
      };
  
      const message = messages[newStatus];
      if (message) {
        showNotification(message, 'success');
      }
    }
  
    // Stop polling
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    }
  
    // Bind additional events
    bindEvents() {
      // Refresh button
      const refreshBtn = document.getElementById('refreshOrder');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.fetchOrderStatus()
            .then(order => {
              this.updateOrderDisplay(order);
              showNotification('Order status refreshed', 'info');
            })
            .catch(error => {
              showNotification('Failed to refresh order status', 'error');
            });
        });
      }
  
      // Cancel order button (if applicable)
      const cancelBtn = document.getElementById('cancelOrder');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', this.cancelOrder.bind(this));
      }
    }
  
    // Cancel order functionality
    async cancelOrder() {
      if (!confirm('Are you sure you want to cancel this order?')) {
        return;
      }
  
      try {
        const response = await fetch(`/orders/${this.orderId}/cancel`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        if (response.ok) {
          showNotification('Order cancelled successfully', 'success');
          this.stopPolling();
          // Refresh page or update UI
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          throw new Error('Failed to cancel order');
        }
      } catch (error) {
        showNotification('Failed to cancel order', 'error');
      }
    }
  
    // Cleanup when component is destroyed
    destroy() {
      this.stopPolling();
    }
  }
  
  // Initialize order tracker when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    const orderIdElement = document.getElementById('orderId');
    if (orderIdElement) {
      const orderId = orderIdElement.dataset.orderId;
      window.orderTracker = new OrderTracker(orderId);
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.orderTracker) {
      window.orderTracker.destroy();
    }
  });