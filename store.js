/**
 * Quản lý trạng thái và dữ liệu (State Management) với LocalStorage
 * Yên Paper&Card - Dashboard Điều Hành Doanh Nghiệp
 */

const STORAGE_KEY = 'YEN_PAPERCARD_DASHBOARD_DATA_V2';

class Store {
  constructor() {
    this.subscribers = [];
    this.timeFilter = 'month'; // 'today', '7days', 'month', 'quarter', 'all'
    this.data = this.loadData();
  }

  // Khởi tạo hoặc tải từ LocalStorage
  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Không thể đọc từ localStorage, sử dụng dữ liệu mặc định:', e);
    }
    const initial = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData(initial);
    return initial;
  }

  saveData(dataToSave) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave || this.data));
    } catch (e) {
      console.error('Không thể lưu vào localStorage:', e);
    }
  }

  // Khôi phục dữ liệu mẫu ban đầu
  resetToSampleData() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData();
    this.notify('all', 'Đã khôi phục dữ liệu mẫu thành công!');
    return this.data;
  }

  // Đăng ký lắng nghe sự kiện thay đổi dữ liệu
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify(action, message = '') {
    this.subscribers.forEach(cb => {
      try {
        cb({ action, message, timeFilter: this.timeFilter, data: this.data });
      } catch (err) {
        console.error('Lỗi khi thực thi subscriber:', err);
      }
    });
  }

  // Đổi bộ lọc thời gian
  setTimeFilter(filter) {
    this.timeFilter = filter;
    this.notify('filter-changed', `Đã chuyển bộ lọc: ${this.getTimeFilterName(filter)}`);
  }

  getTimeFilterName(filter) {
    switch (filter) {
      case 'today': return 'Hôm nay';
      case '7days': return '7 ngày qua';
      case 'month': return 'Tháng này (Tháng 11)';
      case 'quarter': return 'Quý này (Quý 4/2026)';
      case 'all': return 'Toàn bộ năm 2026';
      default: return 'Tháng này';
    }
  }

  // ==================== QUẢN LÝ SẢN PHẨM ====================
  getProducts() {
    return this.data.products;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  addProduct(product) {
    const newId = 'SP-' + String(this.data.products.length + 1).padStart(3, '0');
    const newProduct = {
      ...product,
      id: product.id || newId,
      salesCount: Number(product.salesCount) || 0,
      price: Number(product.price) || 0,
      originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
      rating: Number(product.rating) || 5.0,
      status: product.status || 'active',
      features: Array.isArray(product.features) ? product.features : (product.features ? product.features.split(',').map(s => s.trim()) : ['Tương thích Mobile', 'Bản đồ chỉ đường', 'Hộp mừng online'])
    };
    this.data.products.unshift(newProduct);
    this.saveData();
    this.notify('product-added', `Đã thêm mẫu thiệp "${newProduct.name}"`);
    return newProduct;
  }

  updateProduct(id, updatedFields) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      if (updatedFields.price !== undefined) updatedFields.price = Number(updatedFields.price);
      if (updatedFields.originalPrice !== undefined) updatedFields.originalPrice = Number(updatedFields.originalPrice);
      if (typeof updatedFields.features === 'string') {
        updatedFields.features = updatedFields.features.split(',').map(s => s.trim()).filter(Boolean);
      }
      this.data.products[idx] = { ...this.data.products[idx], ...updatedFields };
      this.saveData();
      this.notify('product-updated', `Đã cập nhật sản phẩm ${id}`);
      return this.data.products[idx];
    }
    return null;
  }

  deleteProduct(id) {
    const product = this.getProductById(id);
    if (!product) return false;
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.saveData();
    this.notify('product-deleted', `Đã xóa sản phẩm "${product.name}"`);
    return true;
  }

  // ==================== QUẢN LÝ ĐƠN HÀNG ====================
  getOrders() {
    return this.data.orders;
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.id === id);
  }

  addOrder(orderData) {
    const nextNum = 8822 + Math.floor(Math.random() * 100);
    const orderId = orderData.id || `YEN-${nextNum}`;
    
    // Tìm sản phẩm
    const product = this.getProductById(orderData.productId) || {
      name: orderData.productName || 'Mẫu Thiệp Tùy Biến',
      category: orderData.category || 'thiep-cuoi',
      categoryName: orderData.categoryName || 'Thiệp cưới'
    };

    const newOrder = {
      id: orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone || '0900 000 000',
      productId: orderData.productId,
      productName: orderData.productName || product.name,
      category: orderData.category || product.category,
      categoryName: orderData.categoryName || product.categoryName,
      price: Number(orderData.price) || product.price || 450000,
      orderDate: orderData.orderDate || new Date().toISOString().split('T')[0],
      deliveryDate: orderData.deliveryDate || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      status: orderData.status || 'Chờ xác nhận',
      paymentStatus: orderData.paymentStatus || 'Chờ thanh toán',
      paidAmount: Number(orderData.paidAmount) || 0,
      groomBride: orderData.groomBride || orderData.customerName,
      eventDate: orderData.eventDate || '',
      customNotes: orderData.customNotes || 'Chưa có ghi chú đặc biệt'
    };

    this.data.orders.unshift(newOrder);

    // Cập nhật lượt bán cho sản phẩm
    const prod = this.getProductById(newOrder.productId);
    if (prod) {
      prod.salesCount = (prod.salesCount || 0) + 1;
    }

    // Cập nhật hoặc thêm khách hàng
    const existingCust = this.data.customers.find(c => c.name.toLowerCase() === newOrder.customerName.toLowerCase() || c.phone === newOrder.customerPhone);
    if (existingCust) {
      existingCust.orderCount = (existingCust.orderCount || 0) + 1;
      existingCust.totalSpent = (existingCust.totalSpent || 0) + newOrder.price;
      existingCust.lastOrderDate = newOrder.orderDate;
    } else {
      this.data.customers.unshift({
        id: 'KH-' + (100 + this.data.customers.length + 1),
        name: newOrder.customerName,
        phone: newOrder.customerPhone,
        email: `${newOrder.customerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        address: 'Toàn quốc',
        channel: 'Website trực tiếp',
        tier: 'Mới',
        totalSpent: newOrder.price,
        orderCount: 1,
        lastOrderDate: newOrder.orderDate,
        notes: newOrder.customNotes
      });
    }

    this.saveData();
    this.notify('order-added', `Tạo thành công đơn hàng mới #${newOrder.id}`);
    return newOrder;
  }

  updateOrderStatus(id, newStatus) {
    const order = this.getOrderById(id);
    if (order) {
      order.status = newStatus;
      if (newStatus === 'Hoàn thành' || newStatus === 'Đã giao') {
        order.paymentStatus = 'Đã thanh toán 100%';
        order.paidAmount = order.price;
      }
      this.saveData();
      this.notify('order-status-changed', `Cập nhật đơn #${id} sang trạng thái: "${newStatus}"`);
      return order;
    }
    return null;
  }

  updateOrder(id, fields) {
    const idx = this.data.orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      if (fields.price !== undefined) fields.price = Number(fields.price);
      if (fields.paidAmount !== undefined) fields.paidAmount = Number(fields.paidAmount);
      this.data.orders[idx] = { ...this.data.orders[idx], ...fields };
      this.saveData();
      this.notify('order-updated', `Cập nhật thông tin đơn hàng #${id}`);
      return this.data.orders[idx];
    }
    return null;
  }

  deleteOrder(id) {
    const order = this.getOrderById(id);
    if (!order) return false;
    this.data.orders = this.data.orders.filter(o => o.id !== id);
    this.saveData();
    this.notify('order-deleted', `Đã xóa đơn hàng #${id}`);
    return true;
  }

  // ==================== QUẢN LÝ KHÁCH HÀNG ====================
  getCustomers() {
    return this.data.customers;
  }

  getCustomerById(id) {
    return this.data.customers.find(c => c.id === id);
  }

  addCustomer(customer) {
    const newId = 'KH-' + (100 + this.data.customers.length + 1);
    const newCust = {
      ...customer,
      id: customer.id || newId,
      totalSpent: Number(customer.totalSpent) || 0,
      orderCount: Number(customer.orderCount) || 0,
      tier: customer.tier || 'Mới',
      lastOrderDate: customer.lastOrderDate || new Date().toISOString().split('T')[0]
    };
    this.data.customers.unshift(newCust);
    this.saveData();
    this.notify('customer-added', `Đã thêm khách hàng ${newCust.name}`);
    return newCust;
  }

  updateCustomer(id, fields) {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      if (fields.totalSpent !== undefined) fields.totalSpent = Number(fields.totalSpent);
      if (fields.orderCount !== undefined) fields.orderCount = Number(fields.orderCount);
      this.data.customers[idx] = { ...this.data.customers[idx], ...fields };
      this.saveData();
      this.notify('customer-updated', `Cập nhật thông tin khách hàng ${this.data.customers[idx].name}`);
      return this.data.customers[idx];
    }
    return null;
  }

  deleteCustomer(id) {
    const cust = this.getCustomerById(id);
    if (!cust) return false;
    this.data.customers = this.data.customers.filter(c => c.id !== id);
    this.saveData();
    this.notify('customer-deleted', `Đã xóa khách hàng ${cust.name}`);
    return true;
  }

  // ==================== QUẢN LÝ CHI PHÍ VẬN HÀNH ====================
  getExpenses() {
    return this.data.expenses;
  }

  addExpense(expense) {
    const newId = 'CP-' + String(this.data.expenses.length + 1).padStart(2, '0');
    const newExp = {
      ...expense,
      id: expense.id || newId,
      amount: Number(expense.amount) || 0,
      date: expense.date || new Date().toISOString().split('T')[0]
    };
    this.data.expenses.unshift(newExp);
    this.saveData();
    this.notify('expense-added', `Đã ghi nhận chi phí: ${newExp.name}`);
    return newExp;
  }

  deleteExpense(id) {
    this.data.expenses = this.data.expenses.filter(e => e.id !== id);
    this.saveData();
    this.notify('expense-deleted', `Đã xóa khoản chi phí #${id}`);
    return true;
  }

  // ==================== TÍNH TOÁN KPI VÀ BÁO CÁO ĐIỀU HÀNH CEO ====================
  getKPIData() {
    const filter = this.timeFilter;
    const orders = this.data.orders;
    const products = this.data.products;
    const marketing = this.data.marketingStats;
    const monthly = this.data.monthlyPerformance;

    // Tổng số mẫu thiệp đang kinh doanh
    const activeProductsCount = products.filter(p => p.status === 'active').length;

    // Các đơn hàng đang trong tiến trình xử lý
    const processingStatuses = ['Chờ xác nhận', 'Đang thiết kế', 'Chờ duyệt'];
    const processingOrdersCount = orders.filter(o => processingStatuses.includes(o.status)).length;

    let totalRevenue = 0;
    let totalOrders = 0;
    let websiteVisits = marketing.websiteVisits;
    let conversionRate = marketing.conversionRate;
    let customerSatisfaction = marketing.customerSatisfaction;

    if (filter === 'today') {
      const today = '2026-11-20';
      const todayOrders = orders.filter(o => o.orderDate === today);
      totalOrders = todayOrders.length > 0 ? todayOrders.length : 2;
      totalRevenue = todayOrders.reduce((sum, o) => sum + (o.price || 0), 0) || 630000;
      websiteVisits = 65;
      conversionRate = ((totalOrders / websiteVisits) * 100).toFixed(2);
    } else if (filter === '7days') {
      const recentOrders = orders.slice(0, 8);
      totalOrders = recentOrders.length;
      totalRevenue = recentOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      websiteVisits = 450;
      conversionRate = 3.55;
    } else if (filter === 'month') {
      // Tháng 11: Doanh thu thực tế 3.650.000 đ (Quy mô 3-4 triệu VNĐ)
      const novData = monthly.find(m => m.month.includes('T11')) || { actualRevenue: 3650000, ordersCount: 15 };
      totalRevenue = novData.actualRevenue;
      totalOrders = novData.ordersCount;
      websiteVisits = marketing.websiteVisits;
      conversionRate = marketing.conversionRate;
    } else if (filter === 'quarter') {
      // Quý 4 (T10, T11)
      const q4Data = monthly.filter(m => ['T10/2026', 'T11/2026'].includes(m.month));
      totalRevenue = q4Data.reduce((s, m) => s + m.actualRevenue, 0);
      totalOrders = q4Data.reduce((s, m) => s + m.ordersCount, 0);
      websiteVisits = 2800;
      conversionRate = 3.68;
    } else { // 'all'
      totalRevenue = monthly.reduce((s, m) => s + m.actualRevenue, 0);
      totalOrders = monthly.reduce((s, m) => s + m.ordersCount, 0);
      websiteVisits = 5200;
      conversionRate = 3.62;
    }

    // Giá trị đơn hàng trung bình (AOV)
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Chi phí và Lợi nhuận
    const totalExpenses = this.data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      totalRevenue,
      totalOrders,
      websiteVisits,
      conversionRate: Number(conversionRate),
      averageOrderValue,
      customerSatisfaction,
      processingOrdersCount,
      activeProductsCount,
      totalExpenses,
      netProfit,
      profitMargin: Number(profitMargin),
      timeFilter: filter,
      filterName: this.getTimeFilterName(filter)
    };
  }

  // Phân tích cơ cấu đơn hàng theo danh mục
  getCategoryBreakdown() {
    const orders = this.data.orders;
    const catMap = {
      'thiep-cuoi': { label: 'Thiệp cưới', count: 0, revenue: 0, color: '#0284c7' },
      'thiep-sinh-nhat': { label: 'Thiệp sinh nhật', count: 0, revenue: 0, color: '#f59e0b' },
      'thiep-khai-truong': { label: 'Thiệp khai trương', count: 0, revenue: 0, color: '#3b82f6' },
      'thiep-su-kien': { label: 'Thiệp sự kiện', count: 0, revenue: 0, color: '#8b5cf6' },
      'thiep-chuc-mung': { label: 'Thiệp chúc mừng', count: 0, revenue: 0, color: '#10b981' }
    };

    orders.forEach(o => {
      const catKey = o.category || 'thiep-cuoi';
      if (catMap[catKey]) {
        catMap[catKey].count += 1;
        catMap[catKey].revenue += (o.price || 0);
      }
    });

    const totalOrders = orders.length || 1;
    return Object.keys(catMap).map(key => ({
      key,
      label: catMap[key].label,
      count: catMap[key].count,
      revenue: catMap[key].revenue,
      percentage: Math.round((catMap[key].count / totalOrders) * 100),
      color: catMap[key].color
    }));
  }

  // Top sản phẩm thiệp bán chạy nhất
  getTopSellingProducts(limit = 5) {
    const sorted = [...this.data.products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    return sorted.slice(0, limit);
  }
}

// Khởi tạo Singleton Store
const store = new Store();
