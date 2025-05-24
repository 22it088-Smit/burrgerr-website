// Admin Dashboard JavaScript with ES6 and Data Management

class AdminDashboard {
    constructor() {
      this.init();
    }
  
    init() {
      this.bindEvents();
      this.initializeCharts();
      this.startRealTimeUpdates();
    }
  
    bindEvents() {
      // Order status updates
      this.bindOrderStatusUpdates();
      
      // Inventory management
      this.bindInventoryUpdates();
      
      // Bulk actions
      this.bindBulkActions();
    }
  
    // Order status management using higher-order functions
    bindOrderStatusUpdates() {
      const statusSelects = document.querySelectorAll('.status-select');
      
      statusSelects.forEach(select => {
        select.addEventListener('change', this.updateOrderStatus.bind(this));
      });
    }
  
    async updateOrderStatus(event) {
      const select = event.target;
      const orderId = select.dataset.orderId;
      const newStatus = select.value;
      const originalStatus = select.dataset.originalStatus;
  
      try {
        const response = await fetch(`/admin/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });
  
        if (response.ok) {
          const result = await response.json();
          
          // Update UI
          select.dataset.originalStatus = newStatus;
          this.updateOrderRow(orderId, result.order);
          
          showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
        } else {
          // Revert select value
          select.value = originalStatus;
          throw new Error('Failed to update order status');
        }
      } catch (error) {
        select.value = originalStatus;
        showNotification('Failed to update order status', 'error');
      }
    }
  
    // Update order row in table
    updateOrderRow(orderId, orderData) {
      const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
      if (!row) return;
  
      // Update status badge
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge) {
        statusBadge.textContent = orderData.status;
        statusBadge.className = `status-badge status-${orderData.status}`;
      }
  
      // Add visual feedback
      row.classList.add('updated');
      setTimeout(() => {
        row.classList.remove('updated');
      }, 2000);
    }
  
    // Inventory management
    bindInventoryUpdates() {
      const stockInputs = document.querySelectorAll('.stock-input');
      
      stockInputs.forEach(input => {
        input.addEventListener('blur', this.updateStock.bind(this));
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.updateStock(e);
          }
        });
      });
    }
  
    async updateStock(event) {
      const input = event.target;
      const ingredientId = input.dataset.ingredientId;
      const newStock = parseInt(input.value);
      const originalStock = parseInt(input.dataset.originalStock);
  
      if (isNaN(newStock) || newStock < 0) {
        input.value = originalStock;
        showNotification('Please enter a valid stock number', 'error');
        return;
      }
  
      try {
        const response = await fetch(`/admin/inventory/${ingredientId}/stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ stock: newStock })
        });
  
        if (response.ok) {
          const result = await response.json();
          
          // Update original stock value
          input.dataset.originalStock = newStock;
          
          // Update stock status indicator
          this.updateStockStatus(ingredientId, result.ingredient);
          
          showNotification(`Stock updated for ${result.ingredient.name}`, 'success');
        } else {
          input.value = originalStock;
          throw new Error('Failed to update stock');
        }
      } catch (error) {
        input.value = originalStock;
        showNotification('Failed to update stock', 'error');
      }
    }
  
    // Update stock status indicators
    updateStockStatus(ingredientId, ingredient) {
      const row = document.querySelector(`tr[data-ingredient-id="${ingredientId}"]`);
      if (!row) return;
  
      const statusCell = row.querySelector('.stock-status');
      if (statusCell) {
        const isLowStock = ingredient.stock <= ingredient.minStock;
        statusCell.textContent = isLowStock ? 'Low Stock' : 'In Stock';
        statusCell.className = `stock-status ${isLowStock ? 'stock-low' : 'stock-ok'}`;
      }
    }
  
    // Bulk actions for orders
    bindBulkActions() {
      const bulkActionBtn = document.getElementById('bulkActionBtn');
      const bulkActionSelect = document.getElementById('bulkActionSelect');
      const orderCheckboxes = document.querySelectorAll('.order-checkbox');
  
      if (bulkActionBtn) {
        bulkActionBtn.addEventListener('click', this.performBulkAction.bind(this));
      }
  
      // Update bulk action button state
      orderCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', this.updateBulkActionButton.bind(this));
      });
    }
  
    updateBulkActionButton() {
      const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
      const bulkActionBtn = document.getElementById('bulkActionBtn');
      
      if (bulkActionBtn) {
        bulkActionBtn.disabled = checkedBoxes.length === 0;
        bulkActionBtn.textContent = `Apply to ${checkedBoxes.length} orders`;
      }
    }
  
    async performBulkAction() {
      const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
      const actionSelect = document.getElementById('bulkActionSelect');
      
      if (checkedBoxes.length === 0 || !actionSelect) {
        showNotification('Please select orders and an action', 'error');
        return;
      }
  
      const action = actionSelect.value;
      const orderIds = Array.from(checkedBoxes).map(cb => cb.value);
  
      if (!confirm(`Are you sure you want to ${action} ${orderIds.length} orders?`)) {
        return;
      }
  
      try {
        const promises = orderIds.map(orderId => 
          fetch(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: action })
          })
        );
  
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.ok).length;
  
        if (successCount === orderIds.length) {
          showNotification(`Successfully updated ${successCount} orders`, 'success');
          // Refresh the page or update UI
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          showNotification(`Updated ${successCount} out of ${orderIds.length} orders`, 'warning');
        }
      } catch (error) {
        showNotification('Failed to perform bulk action', 'error');
      }
    }
  
    // Initialize charts for analytics
    initializeCharts() {
      this.initSalesChart();
      this.initOrderStatusChart();
      this.initTopBurgersChart();
    }
  
    // Sales chart using Chart.js (if available)
    initSalesChart() {
      const salesChartCanvas = document.getElementById('salesChart');
      if (!salesChartCanvas || typeof Chart === 'undefined') return;
  
      // Sample data - replace with actual data from server
      const salesData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales (₹)',
          data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
          borderColor: '#ea580c',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          tension: 0.4
        }]
      };
  
      new Chart(salesChartCanvas, {
        type: 'line',
        data: salesData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Weekly Sales'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  
    // Order status distribution chart
    initOrderStatusChart() {
      const statusChartCanvas = document.getElementById('statusChart');
      if (!statusChartCanvas || typeof Chart === 'undefined') return;
  
      const statusData = {
        labels: ['Placed', 'Preparing', 'Packaging', 'Out for Delivery', 'Delivered'],
        datasets: [{
          data: [12, 8, 5, 3, 45],
          backgroundColor: [
            '#3b82f6',
            '#f59e0b',
            '#8b5cf6',
            '#f97316',
            '#10b981'
          ]
        }]
      };
  
      new Chart(statusChartCanvas, {
        type: 'doughnut',
        data: statusData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Order Status Distribution'
            }
          }
        }
      });
    }
  
    // Top burgers chart
    initTopBurgersChart() {
      const burgersChartCanvas = document.getElementById('burgersChart');
      if (!burgersChartCanvas || typeof Chart === 'undefined') return;
  
      const burgersData = {
        labels: ['Maharaja Mac', 'McAloo Tikki', 'Chicken Burger', 'Veg Deluxe', 'Spicy Paneer'],
        datasets: [{
          label: 'Orders',
          data: [45, 38, 32, 28, 22],
          backgroundColor: '#ea580c'
        }]
      };
  
      new Chart(burgersChartCanvas, {
        type: 'bar',
        data: burgersData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Top Selling Burgers'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  
    // Real-time updates for dashboard
    startRealTimeUpdates() {
      // Update dashboard stats every 30 seconds
      setInterval(() => {
        this.updateDashboardStats();
      }, 30000);
    }
  
    async updateDashboardStats() {
      try {
        const response = await fetch('/admin/dashboard/stats', {
          headers: {
            'Accept': 'application/json'
          }
        });
  
        if (response.ok) {
          const stats = await response.json();
          this.updateStatsDisplay(stats);
        }
      } catch (error) {
        console.error('Failed to update dashboard stats:', error);
      }
    }
  
    // Update stats display
    updateStatsDisplay(stats) {
      const statElements = {
        totalOrders: document.getElementById('totalOrders'),
        totalRevenue: document.getElementById('totalRevenue'),
        totalUsers: document.getElementById('totalUsers'),
        lowStockCount: document.getElementById('lowStockCount')
      };
  
      Object.keys(statElements).forEach(key => {
        const element = statElements[key];
        if (element && stats[key] !== undefined) {
          element.textContent = stats[key];
        }
      });
    }
  
    // Export data functionality
    exportData(type) {
      const exportUrl = `/admin/export/${type}`;
      window.open(exportUrl, '_blank');
    }
  
    // Search and filter functionality
    initializeFilters() {
      const searchInput = document.getElementById('searchOrders');
      const statusFilter = document.getElementById('statusFilter');
      const dateFilter = document.getElementById('dateFilter');
  
      if (searchInput) {
        searchInput.addEventListener('input', this.debounce(this.filterOrders.bind(this), 300));
      }
  
      if (statusFilter) {
        statusFilter.addEventListener('change', this.filterOrders.bind(this));
      }
  
      if (dateFilter) {
        dateFilter.addEventListener('change', this.filterOrders.bind(this));
      }
    }
  
    // Debounce function for search
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
  
    // Filter orders based on search and filters
    filterOrders() {
      const searchTerm = document.getElementById('searchOrders')?.value.toLowerCase() || '';
      const statusFilter = document.getElementById('statusFilter')?.value || '';
      const dateFilter = document.getElementById('dateFilter')?.value || '';
  
      const orderRows = document.querySelectorAll('.order-row');
  
      orderRows.forEach(row => {
        const orderId = row.dataset.orderId?.toLowerCase() || '';
        const customerName = row.querySelector('.customer-name')?.textContent.toLowerCase() || '';
        const orderStatus = row.querySelector('.status-badge')?.textContent.toLowerCase() || '';
        const orderDate = row.dataset.orderDate || '';
  
        const matchesSearch = orderId.includes(searchTerm) || customerName.includes(searchTerm);
        const matchesStatus = !statusFilter || orderStatus === statusFilter.toLowerCase();
        const matchesDate = !dateFilter || orderDate.startsWith(dateFilter);
  
        if (matchesSearch && matchesStatus && matchesDate) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  }
  
  // Initialize admin dashboard when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('admin-page')) {
      window.adminDashboard = new AdminDashboard();
    }
  });