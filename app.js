/**
 * Ứng dụng Quản Trị Kinh Doanh Yên Paper&Card
 * Phong cách BizDocsHub - Bảng Điều Hành CEO
 */

class DashboardApp {
  constructor() {
    this.currentTab = 'overview';
    this.orderFilterStatus = 'all';
    this.orderSearchQuery = '';
    this.productCategoryFilter = 'all';
    this.productSearchQuery = '';
    this.customerSearchQuery = '';
    this.activeCustomerHistory = null;
    this.activePreviewProduct = null;
  }

  init() {
    this.bindEvents();
    this.renderAll();
    
    // Đăng ký lắng nghe sự kiện từ store
    store.subscribe((event) => {
      this.handleStoreEvent(event);
    });

    // Khởi tạo biểu đồ khi DOM sẵn sàng
    setTimeout(() => {
      dashboardCharts.renderAll();
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  }

  // Tiện ích định dạng số và tiền tệ
  formatVND(amount) {
    return Number(amount || 0).toLocaleString('vi-VN') + ' đ';
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  }

  // Hiển thị thông báo Toast
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <i data-lucide="${iconName}" class="w-4 h-4"></i>
        <span>${message}</span>
      </div>
      <button class="text-white opacity-70 hover:opacity-100 ml-3" onclick="this.parentElement.remove()">
        &times;
      </button>
    `;
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Xử lý sự kiện từ Store
  handleStoreEvent({ action, message }) {
    if (message) {
      this.showToast(message, action.includes('deleted') ? 'warning' : 'success');
    }
    this.renderKPIs();
    this.renderOrdersTable();
    this.renderProductsList();
    this.renderCustomersTable();
    this.renderReports();
    dashboardCharts.renderAll();
    if (window.lucide) window.lucide.createIcons();
  }

  // Chuyển Tab giao diện
  switchTab(tabId) {
    this.currentTab = tabId;

    // Cập nhật navigation menu
    document.querySelectorAll('.nav-link').forEach(el => {
      if (el.getAttribute('data-tab') === tabId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Cập nhật nội dung tab
    document.querySelectorAll('.tab-content').forEach(el => {
      if (el.id === `tab-${tabId}`) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Vẽ lại biểu đồ nếu chuyển về tab overview hoặc reports
    if (tabId === 'overview' || tabId === 'reports') {
      setTimeout(() => {
        dashboardCharts.renderAll();
      }, 50);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ==================== 1. TỔNG QUAN CEO & KPIS ====================
  renderKPIs() {
    const kpi = store.getKPIData();

    // 1. Tổng doanh thu
    const elRevenue = document.getElementById('kpi-revenue');
    if (elRevenue) elRevenue.textContent = this.formatVND(kpi.totalRevenue);

    // 2. Tổng số đơn hàng
    const elOrders = document.getElementById('kpi-orders');
    if (elOrders) elOrders.textContent = `${kpi.totalOrders.toLocaleString('vi-VN')} đơn`;

    // 3. Lượt truy cập website
    const elVisits = document.getElementById('kpi-visits');
    if (elVisits) elVisits.textContent = kpi.websiteVisits.toLocaleString('vi-VN');

    // 4. Tỷ lệ chuyển đổi
    const elConv = document.getElementById('kpi-conversion');
    if (elConv) elConv.textContent = `${kpi.conversionRate}%`;

    // 5. Giá trị đơn hàng trung bình
    const elAOV = document.getElementById('kpi-aov');
    if (elAOV) elAOV.textContent = this.formatVND(kpi.averageOrderValue);

    // 6. Mức độ hài lòng của khách hàng
    const elSatisfaction = document.getElementById('kpi-satisfaction');
    if (elSatisfaction) elSatisfaction.textContent = `${kpi.customerSatisfaction} / 5.0 ⭐`;

    // 7. Số đơn hàng đang xử lý
    const elProcessing = document.getElementById('kpi-processing');
    if (elProcessing) elProcessing.textContent = `${kpi.processingOrdersCount} đơn`;

    // 8. Số mẫu thiệp đang kinh doanh
    const elActiveProds = document.getElementById('kpi-active-products');
    if (elActiveProds) elActiveProds.textContent = `${kpi.activeProductsCount} mẫu`;

    // Header subtext
    const elCurrentFilterName = document.getElementById('currentFilterDisplay');
    if (elCurrentFilterName) elCurrentFilterName.textContent = kpi.filterName;
  }

  // ==================== 2. QUẢN LÝ ĐƠN HÀNG ====================
  renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let orders = [...store.getOrders()];

    // Lọc theo trạng thái
    if (this.orderFilterStatus !== 'all') {
      orders = orders.filter(o => o.status === this.orderFilterStatus);
    }

    // Tìm kiếm theo từ khóa
    if (this.orderSearchQuery.trim()) {
      const q = this.orderSearchQuery.toLowerCase().trim();
      orders = orders.filter(o => 
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.productName.toLowerCase().includes(q)
      );
    }

    // Cập nhật badge số lượng
    const badgeCount = document.getElementById('ordersCountBadge');
    if (badgeCount) badgeCount.textContent = `${orders.length} đơn`;

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-slate-400">
            <i data-lucide="package-search" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const statusClass = this.getStatusBadgeClass(order.status);
      return `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
          <td class="px-4 py-3.5 font-semibold text-sky-700 whitespace-nowrap">
            <div class="flex items-center space-x-1.5">
              <span>#${order.id}</span>
              ${order.status === 'Chờ xác nhận' ? '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>' : ''}
            </div>
          </td>
          <td class="px-4 py-3.5">
            <div class="font-medium text-slate-800">${order.customerName}</div>
            <div class="text-xs text-slate-500 flex items-center space-x-1">
              <span>${order.customerPhone}</span>
            </div>
          </td>
          <td class="px-4 py-3.5">
            <div class="text-slate-700 font-medium">${order.productName}</div>
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-normal">
              ${order.categoryName || 'Thiệp số'}
            </span>
          </td>
          <td class="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
            ${this.formatVND(order.price)}
          </td>
          <td class="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
            <div>Đặt: ${this.formatDate(order.orderDate)}</div>
            <div class="text-slate-400">Hẹn: ${this.formatDate(order.deliveryDate)}</div>
          </td>
          <td class="px-4 py-3.5 whitespace-nowrap">
            <div class="relative inline-block text-left">
              <select 
                class="badge-status ${statusClass} cursor-pointer border pr-5 py-1 text-xs font-semibold rounded-full outline-none focus:ring-2 focus:ring-sky-500 appearance-none bg-no-repeat bg-right"
                style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E'); background-position: right 6px center;"
                onchange="dashboardApp.changeOrderStatus('${order.id}', this.value)"
              >
                <option value="Chờ xác nhận" ${order.status === 'Chờ xác nhận' ? 'selected' : ''}>Chờ xác nhận</option>
                <option value="Đang thiết kế" ${order.status === 'Đang thiết kế' ? 'selected' : ''}>Đang thiết kế</option>
                <option value="Chờ duyệt" ${order.status === 'Chờ duyệt' ? 'selected' : ''}>Chờ duyệt</option>
                <option value="Hoàn thành" ${order.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                <option value="Đã giao" ${order.status === 'Đã giao' ? 'selected' : ''}>Đã giao</option>
              </select>
            </div>
          </td>
          <td class="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
            <button 
              onclick="dashboardApp.viewOrderDetail('${order.id}')"
              class="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
              title="Xem chi tiết đơn hàng"
            >
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="dashboardApp.openEditOrderModal('${order.id}')"
              class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="Chỉnh sửa đơn hàng"
            >
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button 
              onclick="dashboardApp.deleteOrder('${order.id}')"
              class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Xóa đơn hàng"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  getStatusBadgeClass(status) {
    switch (status) {
      case 'Chờ xác nhận': return 'status-pending';
      case 'Đang thiết kế': return 'status-designing';
      case 'Chờ duyệt': return 'status-awaiting';
      case 'Hoàn thành': return 'status-completed';
      case 'Đã giao': return 'status-delivered';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  changeOrderStatus(orderId, newStatus) {
    store.updateOrderStatus(orderId, newStatus);
  }

  deleteOrder(orderId) {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${orderId} không?`)) {
      store.deleteOrder(orderId);
    }
  }

  // ==================== 3. QUẢN LÝ SẢN PHẨM ====================
  renderProductsList() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let products = [...store.getProducts()];

    // Lọc theo danh mục
    if (this.productCategoryFilter !== 'all') {
      products = products.filter(p => p.category === this.productCategoryFilter);
    }

    // Tìm kiếm
    if (this.productSearchQuery.trim()) {
      const q = this.productSearchQuery.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      );
    }

    // Cập nhật số lượng
    const countBadge = document.getElementById('productsCountBadge');
    if (countBadge) countBadge.textContent = `${products.length} mẫu thiệp`;

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400">
          <i data-lucide="layers" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
          Không có mẫu thiệp nào phù hợp danh mục hoặc tìm kiếm.
        </div>
      `;
      return;
    }

    grid.innerHTML = products.map(prod => `
      <div class="card-executive overflow-hidden flex flex-col group">
        <div class="relative h-44 overflow-hidden bg-slate-100">
          <img 
            src="${prod.image}" 
            alt="${prod.name}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'"
          />
          <div class="absolute top-2.5 left-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-sky-900 shadow-sm">
              ${prod.categoryName}
            </span>
          </div>
          <div class="absolute top-2.5 right-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-medium ${prod.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'} shadow-sm">
              ${prod.status === 'active' ? 'Đang bán' : 'Tạm dừng'}
            </span>
          </div>
          <button 
            onclick="dashboardApp.openLivePreview('${prod.id}')"
            class="absolute bottom-2.5 right-2.5 bg-navy-surface text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 opacity-90 hover:opacity-100 shadow-md bg-slate-900/85 backdrop-blur-sm hover:bg-sky-600 transition-colors"
          >
            <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
            <span>Xem demo</span>
          </button>
        </div>

        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Mã: ${prod.id}</span>
              <span class="flex items-center text-amber-500 font-medium">
                ★ ${prod.rating || 4.9}
              </span>
            </div>
            <h3 class="font-bold text-slate-800 text-sm mb-1.5 line-clamp-1" title="${prod.name}">
              ${prod.name}
            </h3>
            <p class="text-xs text-slate-500 line-clamp-2 mb-3">
              ${prod.description || 'Mẫu thiệp số cao cấp tích hợp RSVP, đếm ngược, nhạc nền và bản đồ Google Maps.'}
            </p>

            <div class="flex flex-wrap gap-1 mb-3">
              ${(prod.features || []).slice(0, 3).map(f => `
                <span class="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">
                  ✓ ${f}
                </span>
              `).join('')}
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-400">Đã bán: <span class="font-semibold text-slate-700">${prod.salesCount || 0}</span></div>
              <div class="font-bold text-sky-700 text-base">
                ${this.formatVND(prod.price)}
              </div>
            </div>
            <div class="flex items-center space-x-1">
              <button 
                onclick="dashboardApp.openEditProductModal('${prod.id}')"
                class="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded"
                title="Sửa sản phẩm & Giá"
              >
                <i data-lucide="edit-2" class="w-4 h-4"></i>
              </button>
              <button 
                onclick="dashboardApp.deleteProduct('${prod.id}')"
                class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                title="Xóa sản phẩm"
              >
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  deleteProduct(productId) {
    if (confirm(`Bạn có chắc muốn xóa mẫu thiệp #${productId}?`)) {
      store.deleteProduct(productId);
    }
  }

  // ==================== 4. QUẢN LÝ KHÁCH HÀNG ====================
  renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    let customers = [...store.getCustomers()];

    if (this.customerSearchQuery.trim()) {
      const q = this.customerSearchQuery.toLowerCase().trim();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }

    const countBadge = document.getElementById('customersCountBadge');
    if (countBadge) countBadge.textContent = `${customers.length} khách hàng`;

    tbody.innerHTML = customers.map(c => `
      <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
        <td class="px-4 py-3.5 font-semibold text-sky-700">${c.id}</td>
        <td class="px-4 py-3.5">
          <div class="font-semibold text-slate-800">${c.name}</div>
          <div class="text-xs text-slate-500">${c.email}</div>
        </td>
        <td class="px-4 py-3.5 text-sm text-slate-600 font-mono">${c.phone}</td>
        <td class="px-4 py-3.5 text-xs text-slate-500">
          <div>${c.address || 'Hà Nội'}</div>
          <div class="text-[11px] text-sky-600">${c.channel || 'Website'}</div>
        </td>
        <td class="px-4 py-3.5 text-center">
          <span class="inline-block px-2 py-0.5 text-xs rounded-full font-semibold bg-sky-100 text-sky-800">
            ${c.orderCount} đơn
          </span>
        </td>
        <td class="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
          ${this.formatVND(c.totalSpent)}
        </td>
        <td class="px-4 py-3.5 text-center">
          <span class="px-2 py-0.5 text-[11px] font-semibold rounded-full ${
            c.tier === 'Kim Cương' ? 'bg-purple-100 text-purple-800' :
            c.tier === 'VIP' ? 'bg-amber-100 text-amber-800' :
            'bg-slate-100 text-slate-700'
          }">
            ${c.tier || 'Thân thiết'}
          </span>
        </td>
        <td class="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
          <button 
            onclick="dashboardApp.openCustomerHistoryModal('${c.id}')"
            class="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-xs font-medium inline-flex items-center space-x-1"
            title="Xem lịch sử đặt thiệp"
          >
            <i data-lucide="history" class="w-3.5 h-3.5"></i>
            <span>Lịch sử (${c.orderCount})</span>
          </button>
          <button 
            onclick="dashboardApp.openEditCustomerModal('${c.id}')"
            class="p-1 text-slate-500 hover:text-sky-600 rounded"
            title="Sửa thông tin"
          >
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // ==================== 5. BÁO CÁO KINH DOANH & TÀI CHÍNH ====================
  renderReports() {
    const kpi = store.getKPIData();
    const expenses = store.getExpenses();

    // Thống kê Doanh thu - Chi phí - Lợi nhuận
    const elRev = document.getElementById('report-revenue');
    const elExp = document.getElementById('report-expense');
    const elNet = document.getElementById('report-net-profit');
    const elMargin = document.getElementById('report-margin');

    if (elRev) elRev.textContent = this.formatVND(kpi.totalRevenue);
    if (elExp) elExp.textContent = this.formatVND(kpi.totalExpenses);
    if (elNet) elNet.textContent = this.formatVND(kpi.netProfit);
    if (elMargin) elMargin.textContent = `${kpi.profitMargin}%`;

    // Render bảng chi phí vận hành
    const expTbody = document.getElementById('expensesTableBody');
    if (expTbody) {
      expTbody.innerHTML = expenses.map(e => `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
          <td class="px-4 py-3 text-xs font-semibold text-slate-700">${e.id}</td>
          <td class="px-4 py-3 font-medium text-slate-800 text-sm">${e.name}</td>
          <td class="px-4 py-3 text-xs text-slate-500">${e.category}</td>
          <td class="px-4 py-3 text-xs text-slate-500">${this.formatDate(e.date)}</td>
          <td class="px-4 py-3 font-semibold text-rose-600 text-sm">${this.formatVND(e.amount)}</td>
          <td class="px-4 py-3 text-xs text-slate-400">${e.note || '-'}</td>
          <td class="px-4 py-3 text-right">
            <button onclick="dashboardApp.deleteExpense('${e.id}')" class="text-slate-400 hover:text-rose-600 p-1">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  deleteExpense(expId) {
    if (confirm(`Bạn có chắc muốn xóa khoản chi phí #${expId}?`)) {
      store.deleteExpense(expId);
    }
  }

  // ==================== 6. MODALS & FORMS ====================
  // Modal Thêm/Sửa Đơn Hàng
  openAddOrderModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    document.getElementById('orderModalTitle').textContent = 'Tạo Đơn Hàng Mới';
    document.getElementById('orderForm').reset();
    document.getElementById('orderIdInput').value = '';
    
    // Đổ danh sách sản phẩm vào select
    const select = document.getElementById('orderProductSelect');
    select.innerHTML = store.getProducts().map(p => `
      <option value="${p.id}" data-price="${p.price}" data-category="${p.category}" data-categoryname="${p.categoryName}">
        ${p.name} - ${this.formatVND(p.price)}
      </option>
    `).join('');
    
    if (store.getProducts().length > 0) {
      document.getElementById('orderPriceInput').value = store.getProducts()[0].price;
    }

    modal.classList.remove('hidden');
  }

  openEditOrderModal(orderId) {
    const order = store.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById('orderModal');
    document.getElementById('orderModalTitle').textContent = `Chỉnh Sửa Đơn Hàng #${order.id}`;
    document.getElementById('orderIdInput').value = order.id;
    document.getElementById('orderCustomerName').value = order.customerName;
    document.getElementById('orderCustomerPhone').value = order.customerPhone || '';
    document.getElementById('orderPriceInput').value = order.price;
    document.getElementById('orderStatusSelect').value = order.status;
    document.getElementById('orderDateInput').value = order.orderDate;
    document.getElementById('orderDeliveryDateInput').value = order.deliveryDate;
    document.getElementById('orderGroomBrideInput').value = order.groomBride || '';
    document.getElementById('orderNotesInput').value = order.customNotes || '';

    const select = document.getElementById('orderProductSelect');
    select.innerHTML = store.getProducts().map(p => `
      <option value="${p.id}" ${p.id === order.productId ? 'selected' : ''} data-price="${p.price}">
        ${p.name} - ${this.formatVND(p.price)}
      </option>
    `).join('');

    modal.classList.remove('hidden');
  }

  closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.add('hidden');
  }

  saveOrderFromForm(e) {
    e.preventDefault();
    const id = document.getElementById('orderIdInput').value;
    const select = document.getElementById('orderProductSelect');
    const selectedOpt = select.options[select.selectedIndex];

    const orderData = {
      customerName: document.getElementById('orderCustomerName').value.trim(),
      customerPhone: document.getElementById('orderCustomerPhone').value.trim(),
      productId: select.value,
      productName: selectedOpt.text.split(' - ')[0],
      price: Number(document.getElementById('orderPriceInput').value),
      status: document.getElementById('orderStatusSelect').value,
      orderDate: document.getElementById('orderDateInput').value || new Date().toISOString().split('T')[0],
      deliveryDate: document.getElementById('orderDeliveryDateInput').value,
      groomBride: document.getElementById('orderGroomBrideInput').value,
      customNotes: document.getElementById('orderNotesInput').value
    };

    if (id) {
      store.updateOrder(id, orderData);
    } else {
      store.addOrder(orderData);
    }

    this.closeOrderModal();
  }

  // Modal Thêm/Sửa Sản Phẩm
  openAddProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    document.getElementById('productModalTitle').textContent = 'Thêm Mẫu Thiệp Mới';
    document.getElementById('productForm').reset();
    document.getElementById('productIdInput').value = '';
    modal.classList.remove('hidden');
  }

  openEditProductModal(productId) {
    const prod = store.getProductById(productId);
    if (!prod) return;

    const modal = document.getElementById('productModal');
    document.getElementById('productModalTitle').textContent = `Chỉnh Sửa Mẫu Thiệp ${prod.name}`;
    document.getElementById('productIdInput').value = prod.id;
    document.getElementById('productNameInput').value = prod.name;
    document.getElementById('productCategorySelect').value = prod.category;
    document.getElementById('productPriceInput').value = prod.price;
    document.getElementById('productOriginalPriceInput').value = prod.originalPrice || prod.price;
    document.getElementById('productImageInput').value = prod.image || '';
    document.getElementById('productFeaturesInput').value = (prod.features || []).join(', ');
    document.getElementById('productStatusSelect').value = prod.status || 'active';
    document.getElementById('productDescInput').value = prod.description || '';

    modal.classList.remove('hidden');
  }

  closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('hidden');
  }

  saveProductFromForm(e) {
    e.preventDefault();
    const id = document.getElementById('productIdInput').value;
    const catSelect = document.getElementById('productCategorySelect');
    const catName = catSelect.options[catSelect.selectedIndex].text;

    const prodData = {
      name: document.getElementById('productNameInput').value.trim(),
      category: catSelect.value,
      categoryName: catName,
      price: Number(document.getElementById('productPriceInput').value),
      originalPrice: Number(document.getElementById('productOriginalPriceInput').value) || Number(document.getElementById('productPriceInput').value),
      image: document.getElementById('productImageInput').value.trim() || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      features: document.getElementById('productFeaturesInput').value,
      status: document.getElementById('productStatusSelect').value,
      description: document.getElementById('productDescInput').value
    };

    if (id) {
      store.updateProduct(id, prodData);
    } else {
      store.addProduct(prodData);
    }

    this.closeProductModal();
  }

  // Modal Thêm Chi Phí Vận Hành
  openAddExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (modal) {
      document.getElementById('expenseForm').reset();
      document.getElementById('expenseDateInput').value = new Date().toISOString().split('T')[0];
      modal.classList.remove('hidden');
    }
  }

  closeExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (modal) modal.classList.add('hidden');
  }

  saveExpenseFromForm(e) {
    e.preventDefault();
    const expenseData = {
      name: document.getElementById('expenseNameInput').value.trim(),
      category: document.getElementById('expenseCategorySelect').value,
      amount: Number(document.getElementById('expenseAmountInput').value),
      date: document.getElementById('expenseDateInput').value,
      note: document.getElementById('expenseNoteInput').value.trim()
    };

    store.addExpense(expenseData);
    this.closeExpenseModal();
  }

  // Modal Chi Tiết Đơn Hàng / Hóa Đơn
  viewOrderDetail(orderId) {
    const order = store.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailModal');
    const container = document.getElementById('orderDetailContent');
    if (!container) return;

    container.innerHTML = `
      <div class="border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400">Chi tiết đơn hàng số</span>
          <h2 class="text-xl font-bold text-sky-800">#${order.id}</h2>
        </div>
        <div>
          <span class="badge-status ${this.getStatusBadgeClass(order.status)}">${order.status}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm mb-6">
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">Thông tin khách hàng</span>
          <div class="font-bold text-slate-800">${order.customerName}</div>
          <div class="text-slate-600">${order.customerPhone}</div>
          <div class="text-xs text-slate-500 mt-1">Sự kiện / Dâu rể: ${order.groomBride || 'Theo yêu cầu'}</div>
        </div>
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">Thời gian thực hiện</span>
          <div class="text-slate-700">Ngày đặt: <strong>${this.formatDate(order.orderDate)}</strong></div>
          <div class="text-slate-700">Hạn giao: <strong>${this.formatDate(order.deliveryDate)}</strong></div>
          <div class="text-slate-700">Ngày diễn ra: <strong>${this.formatDate(order.eventDate) || 'Chưa cập nhật'}</strong></div>
        </div>
      </div>

      <div class="border rounded-lg border-slate-200 overflow-hidden mb-6">
        <div class="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 flex justify-between">
          <span>Mẫu thiệp số & dịch vụ</span>
          <span>Thành tiền</span>
        </div>
        <div class="p-4 flex justify-between items-center bg-white border-b border-slate-100">
          <div>
            <div class="font-semibold text-slate-800">${order.productName}</div>
            <div class="text-xs text-slate-500">${order.categoryName} • Bản quyền vĩnh viễn • Tên miền riêng</div>
          </div>
          <div class="font-bold text-sky-700 text-base">
            ${this.formatVND(order.price)}
          </div>
        </div>
        <div class="p-3 bg-slate-50 flex justify-between items-center text-xs">
          <span class="text-slate-600">Trạng thái thanh toán: <strong>${order.paymentStatus || 'Đã cọc'}</strong></span>
          <span class="text-slate-800 font-bold">Đã thu: ${this.formatVND(order.paidAmount || order.price)}</span>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mb-4">
        <strong>Ghi chú thiết kế từ khách:</strong>
        <p class="mt-1">${order.customNotes || 'Không có ghi chú đặc biệt.'}</p>
      </div>

      <div class="flex items-center justify-end space-x-2 pt-2">
        <button 
          onclick="dashboardApp.openLivePreview('${order.productId}')"
          class="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-medium flex items-center space-x-1"
        >
          <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
          <span>Xem mô phỏng thiệp</span>
        </button>
        <button 
          onclick="window.print()"
          class="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium flex items-center space-x-1"
        >
          <i data-lucide="printer" class="w-3.5 h-3.5"></i>
          <span>In phiếu đơn hàng</span>
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.add('hidden');
  }

  // Modal Lịch sử Đặt Thiệp của Khách Hàng
  openCustomerHistoryModal(customerId) {
    const cust = store.getCustomerById(customerId);
    if (!cust) return;

    const modal = document.getElementById('customerHistoryModal');
    const container = document.getElementById('customerHistoryContent');
    if (!container) return;

    // Tìm tất cả đơn của khách này
    const orders = store.getOrders().filter(o => 
      o.customerName.toLowerCase() === cust.name.toLowerCase() ||
      o.customerPhone === cust.phone
    );

    container.innerHTML = `
      <div class="border-b border-slate-200 pb-3 mb-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-800">${cust.name}</h3>
          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800">${cust.tier || 'Thành viên'}</span>
        </div>
        <div class="text-xs text-slate-500 mt-1 flex space-x-4">
          <span>SĐT: ${cust.phone}</span>
          <span>Email: ${cust.email}</span>
          <span>Tổng chi: <strong class="text-sky-700">${this.formatVND(cust.totalSpent)}</strong></span>
        </div>
      </div>

      <h4 class="text-xs font-bold uppercase text-slate-400 mb-2">Lịch sử ${orders.length} đơn hàng đã đặt:</h4>
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        ${orders.length > 0 ? orders.map(o => `
          <div class="border border-slate-200 rounded-lg p-3 bg-white flex justify-between items-center text-xs">
            <div>
              <div class="font-bold text-sky-800 flex items-center space-x-1.5">
                <span>#${o.id}</span>
                <span class="badge-status ${this.getStatusBadgeClass(o.status)} text-[10px] py-0.5">${o.status}</span>
              </div>
              <div class="text-slate-700 font-medium mt-1">${o.productName}</div>
              <div class="text-slate-400 text-[11px]">Ngày đặt: ${this.formatDate(o.orderDate)}</div>
            </div>
            <div class="text-right">
              <div class="font-bold text-slate-900">${this.formatVND(o.price)}</div>
              <button 
                onclick="dashboardApp.closeCustomerHistoryModal(); dashboardApp.viewOrderDetail('${o.id}')"
                class="text-sky-600 hover:underline text-[11px] mt-1 inline-block"
              >
                Xem chi tiết &rarr;
              </button>
            </div>
          </div>
        `).join('') : '<p class="text-slate-400 text-xs italic">Chưa có lịch sử đơn hàng nào.</p>'}
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeCustomerHistoryModal() {
    const modal = document.getElementById('customerHistoryModal');
    if (modal) modal.classList.add('hidden');
  }

  // Modal Sửa Khách Hàng
  openEditCustomerModal(customerId) {
    const cust = store.getCustomerById(customerId);
    if (!cust) return;

    const modal = document.getElementById('customerModal');
    document.getElementById('customerIdInput').value = cust.id;
    document.getElementById('customerNameInput').value = cust.name;
    document.getElementById('customerPhoneInput').value = cust.phone;
    document.getElementById('customerEmailInput').value = cust.email;
    document.getElementById('customerAddressInput').value = cust.address || '';
    document.getElementById('customerTierSelect').value = cust.tier || 'Thân thiết';
    document.getElementById('customerNotesInput').value = cust.notes || '';

    modal.classList.remove('hidden');
  }

  closeCustomerModal() {
    const modal = document.getElementById('customerModal');
    if (modal) modal.classList.add('hidden');
  }

  saveCustomerFromForm(e) {
    e.preventDefault();
    const id = document.getElementById('customerIdInput').value;
    const custData = {
      name: document.getElementById('customerNameInput').value.trim(),
      phone: document.getElementById('customerPhoneInput').value.trim(),
      email: document.getElementById('customerEmailInput').value.trim(),
      address: document.getElementById('customerAddressInput').value.trim(),
      tier: document.getElementById('customerTierSelect').value,
      notes: document.getElementById('customerNotesInput').value.trim()
    };

    if (id) {
      store.updateCustomer(id, custData);
    } else {
      store.addCustomer(custData);
    }

    this.closeCustomerModal();
  }

  // ==================== 7. XEM LIVE DEMO THIỆP SỐ TRÊN ĐIỆN THOẠI ====================
  openLivePreview(productId) {
    const prod = store.getProductById(productId) || store.getProducts()[0];
    const modal = document.getElementById('livePreviewModal');
    const screen = document.getElementById('phoneMockupScreen');
    if (!modal || !screen) return;

    // Thiết lập nội dung giả lập thiệp số cao cấp
    screen.innerHTML = `
      <div class="relative min-h-full pb-16 bg-slate-900 text-slate-100 font-serif">
        <!-- Banner Hình Ảnh -->
        <div class="relative h-64 overflow-hidden">
          <img src="${prod.image}" class="w-full h-full object-cover filter brightness-90" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <div class="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1 text-[11px] text-amber-300 flex items-center space-x-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live Demo</span>
          </div>

          <div class="absolute bottom-4 left-4 right-4 text-center">
            <span class="text-[10px] tracking-widest uppercase text-amber-300 font-sans block mb-1">
              YÊN PAPER&CARD • THIỆP SỐ CAO CẤP
            </span>
            <h1 class="text-lg font-bold text-white drop-shadow-md font-serif">
              ${prod.name}
            </h1>
            <p class="text-xs text-slate-300 mt-1 italic">
              "Cùng viết nên câu chuyện hạnh phúc và lưu giữ khoảnh khắc trọn vẹn"
            </p>
          </div>
        </div>

        <!-- Trình phát nhạc Audio Bar -->
        <div class="mx-3 -mt-3 relative z-10 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between shadow-lg text-xs">
          <div class="flex items-center space-x-2">
            <button id="demoAudioBtn" onclick="dashboardApp.toggleAudioSimulation()" class="w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow">
              ▶
            </button>
            <div>
              <div class="font-medium text-slate-200 text-[11px]">Until I Found You (Acoustic)</div>
              <div class="text-[9px] text-sky-400">Stephen Sanchez • Đang phát</div>
            </div>
          </div>
          <div class="flex space-x-1 items-end h-4">
            <span class="w-1 h-2 bg-sky-400 animate-pulse"></span>
            <span class="w-1 h-4 bg-sky-400 animate-pulse delay-100"></span>
            <span class="w-1 h-3 bg-sky-400 animate-pulse delay-200"></span>
          </div>
        </div>

        <!-- Đếm ngược ngày sự kiện -->
        <div class="p-4 text-center">
          <div class="text-[11px] uppercase tracking-wider text-slate-400 font-sans mb-2">Đếm Ngược Thời Gian</div>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div class="text-base font-bold text-sky-400">28</div>
              <div class="text-[9px] text-slate-400">Ngày</div>
            </div>
            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div class="text-base font-bold text-sky-400">14</div>
              <div class="text-[9px] text-slate-400">Giờ</div>
            </div>
            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div class="text-base font-bold text-sky-400">35</div>
              <div class="text-[9px] text-slate-400">Phút</div>
            </div>
            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div class="text-base font-bold text-sky-400">42</div>
              <div class="text-[9px] text-slate-400">Giây</div>
            </div>
          </div>
        </div>

        <!-- Thời gian & Địa điểm tổ chức -->
        <div class="mx-4 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-center space-y-2">
          <div class="text-amber-300 font-semibold text-sm">TRÂN TRỌNG KÍNH MỜI</div>
          <p class="text-slate-300 text-[11px] leading-relaxed">
            Sự hiện diện của Quý khách là niềm vinh hạnh lớn nhất của gia đình chúng tôi!
          </p>
          <div class="border-t border-slate-700/60 pt-2 text-[11px] text-slate-300">
            <div>📍 <strong>Trung Tâm Hội Nghị Grand Palace</strong></div>
            <div>142/18 Cộng Hòa, P. 4, Tân Bình, TP.HCM</div>
            <div class="mt-1 text-sky-400 font-sans">Vào lúc 18:00 • Thứ Bảy, 18/12/2026</div>
          </div>
          <button onclick="alert('Mở ứng dụng Google Maps dẫn đường đến địa điểm')" class="mt-2 w-full py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[11px] text-slate-200 font-sans">
            🗺 Mở chỉ đường Google Maps
          </button>
        </div>

        <!-- Xác nhận tham dự (RSVP Form) -->
        <div class="m-4 bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-xs font-sans">
          <div class="font-bold text-slate-200 text-center mb-2">XÁC NHẬN THAM DỰ (RSVP)</div>
          <input type="text" placeholder="Họ và tên của bạn..." class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white mb-2" />
          <select class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white mb-2">
            <option>Tôi chắc chắn sẽ đến dự (1 người)</option>
            <option>Tôi sẽ tham dự cùng người thương (2 người)</option>
            <option>Rất tiếc tôi bận việc không thể tham dự</option>
          </select>
          <button onclick="alert('Cảm ơn bạn đã xác nhận tham dự! Lời chúc đã được gửi đến chủ tiệc.')" class="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors">
            Gửi Xác Nhận Tham Dự
          </button>
        </div>

        <!-- Hộp mừng cưới / QR Tiền mừng online -->
        <div class="mx-4 bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center text-xs font-sans">
          <div class="font-bold text-amber-300 mb-1">🎁 Hộp Mừng Cưới & Chúc Phúc</div>
          <p class="text-[10px] text-slate-400 mb-2">Quét mã QR để gửi phong bao mừng online chúc phúc</p>
          <div class="w-28 h-28 bg-white mx-auto rounded-lg p-2 flex items-center justify-center">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=YEN-PAPERCARD-DEMO-GIFT" alt="QR Tiền Mừng" class="w-full h-full object-contain" />
          </div>
          <div class="text-[10px] text-slate-400 mt-2">Vietcombank • 0071000999888 • YÊN CARD</div>
        </div>

        <!-- Footer thương hiệu -->
        <div class="text-center text-[10px] text-slate-500 font-sans mt-4">
          Thiết kế bởi <strong>Yên Paper&Card</strong> © 2026
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  toggleAudioSimulation() {
    const btn = document.getElementById('demoAudioBtn');
    if (!btn) return;
    if (btn.textContent.trim() === '▶') {
      btn.textContent = '⏸';
      this.showToast('Đang mô phỏng phát nhạc nền thiệp số...', 'info');
    } else {
      btn.textContent = '▶';
    }
  }

  closeLivePreview() {
    const modal = document.getElementById('livePreviewModal');
    if (modal) modal.classList.add('hidden');
  }

  // ==================== 8. XUẤT BÁO CÁO EXCEL VÀ PDF ====================
  // Xuất file Excel bằng SheetJS
  exportToExcel() {
    try {
      if (typeof XLSX === 'undefined') {
        alert('Thư viện SheetJS chưa tải xong. Vui lòng thử lại sau vài giây!');
        return;
      }

      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng quan KPI
      const kpi = store.getKPIData();
      const kpiData = [
        ['BÁO CÁO ĐIỀU HÀNH KINH DOANH - YÊN PAPER&CARD'],
        ['Thời điểm xuất báo cáo:', new Date().toLocaleString('vi-VN')],
        ['Kỳ phân tích:', kpi.filterName],
        [],
        ['Chỉ số KPI', 'Giá trị', 'Đơn vị tính'],
        ['Tổng doanh thu', kpi.totalRevenue, 'VNĐ'],
        ['Tổng số đơn hàng', kpi.totalOrders, 'Đơn'],
        ['Lượt truy cập website', kpi.websiteVisits, 'Lượt'],
        ['Tỷ lệ chuyển đổi', kpi.conversionRate, '%'],
        ['Giá trị đơn hàng trung bình (AOV)', kpi.averageOrderValue, 'VNĐ'],
        ['Mức độ hài lòng của khách hàng', kpi.customerSatisfaction, '/ 5.0'],
        ['Số đơn hàng đang xử lý', kpi.processingOrdersCount, 'Đơn'],
        ['Số mẫu thiệp đang kinh doanh', kpi.activeProductsCount, 'Mẫu'],
        ['Tổng chi phí vận hành', kpi.totalExpenses, 'VNĐ'],
        ['Lợi nhuận ròng', kpi.netProfit, 'VNĐ'],
        ['Biên lợi nhuận ròng', kpi.profitMargin, '%']
      ];
      const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(wb, wsKPI, 'Tổng quan KPI');

      // Sheet 2: Danh sách đơn hàng
      const orders = store.getOrders().map(o => ({
        'Mã đơn': o.id,
        'Khách hàng': o.customerName,
        'Số điện thoại': o.customerPhone,
        'Sản phẩm thiệp': o.productName,
        'Danh mục': o.categoryName,
        'Giá bán (VNĐ)': o.price,
        'Ngày đặt': o.orderDate,
        'Hạn giao': o.deliveryDate,
        'Trạng thái': o.status,
        'Thanh toán': o.paymentStatus,
        'Đã thanh toán (VNĐ)': o.paidAmount
      }));
      const wsOrders = XLSX.utils.json_to_sheet(orders);
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Danh sách đơn hàng');

      // Sheet 3: Danh mục sản phẩm & Lượt bán
      const products = store.getProducts().map(p => ({
        'Mã SP': p.id,
        'Tên mẫu thiệp': p.name,
        'Danh mục': p.categoryName,
        'Giá gốc (VNĐ)': p.originalPrice,
        'Giá bán (VNĐ)': p.price,
        'Đã bán (bộ)': p.salesCount,
        'Doanh thu dự kiến (VNĐ)': p.price * p.salesCount,
        'Đánh giá': p.rating,
        'Trạng thái': p.status === 'active' ? 'Đang bán' : 'Tạm dừng'
      }));
      const wsProducts = XLSX.utils.json_to_sheet(products);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Mẫu thiệp & Doanh thu');

      // Sheet 4: Chi phí vận hành
      const expenses = store.getExpenses().map(e => ({
        'Mã chi phí': e.id,
        'Hạng mục': e.name,
        'Phân loại': e.category,
        'Số tiền (VNĐ)': e.amount,
        'Ngày chi': e.date,
        'Ghi chú': e.note
      }));
      const wsExpenses = XLSX.utils.json_to_sheet(expenses);
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Chi phí vận hành');

      // Xuất file
      const fileName = `Bao_Cao_Kinh_Doanh_YenPaperCard_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      this.showToast(`Đã xuất file Excel thành công: ${fileName}`, 'success');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Đã xảy ra lỗi khi xuất file Excel. Vui lòng kiểm tra lại!');
    }
  }

  // Xuất báo cáo PDF / In ấn
  exportToPDF() {
    window.print();
  }

  // ==================== 9. BIND CÁC SỰ KIỆN GIAO DIỆN ====================
  bindEvents() {
    // Tab switching
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Time filter dropdown
    const filterSelect = document.getElementById('globalTimeFilter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        store.setTimeFilter(e.target.value);
      });
    }

    // Orders Filter by Status
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    if (orderStatusFilter) {
      orderStatusFilter.addEventListener('change', (e) => {
        this.orderFilterStatus = e.target.value;
        this.renderOrdersTable();
      });
    }

    // Orders Search input
    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
      orderSearchInput.addEventListener('input', (e) => {
        this.orderSearchQuery = e.target.value;
        this.renderOrdersTable();
      });
    }

    // Products Category filter
    const prodCatFilter = document.getElementById('productCategoryFilter');
    if (prodCatFilter) {
      prodCatFilter.addEventListener('change', (e) => {
        this.productCategoryFilter = e.target.value;
        this.renderProductsList();
      });
    }

    // Products Search input
    const prodSearchInput = document.getElementById('productSearchInput');
    if (prodSearchInput) {
      prodSearchInput.addEventListener('input', (e) => {
        this.productSearchQuery = e.target.value;
        this.renderProductsList();
      });
    }

    // Customers Search input
    const custSearchInput = document.getElementById('customerSearchInput');
    if (custSearchInput) {
      custSearchInput.addEventListener('input', (e) => {
        this.customerSearchQuery = e.target.value;
        this.renderCustomersTable();
      });
    }

    // Revenue chart toggles (Ngày / Tuần / Tháng)
    const btnDay = document.getElementById('btnRevenueDay');
    const btnWeek = document.getElementById('btnRevenueWeek');
    const btnMonth = document.getElementById('btnRevenueMonth');

    if (btnDay && btnWeek && btnMonth) {
      const updateToggleButtons = (activeBtn) => {
        [btnDay, btnWeek, btnMonth].forEach(b => {
          b.classList.remove('bg-white', 'text-sky-700', 'shadow-sm');
          b.classList.add('text-slate-500');
        });
        activeBtn.classList.add('bg-white', 'text-sky-700', 'shadow-sm');
        activeBtn.classList.remove('text-slate-500');
      };

      btnDay.addEventListener('click', () => {
        updateToggleButtons(btnDay);
        dashboardCharts.setRevenueViewMode('day');
      });
      btnWeek.addEventListener('click', () => {
        updateToggleButtons(btnWeek);
        dashboardCharts.setRevenueViewMode('week');
      });
      btnMonth.addEventListener('click', () => {
        updateToggleButtons(btnMonth);
        dashboardCharts.setRevenueViewMode('month');
      });
    }

    // Form Submissions
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => this.saveOrderFromForm(e));
    }

    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => this.saveProductFromForm(e));
    }

    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => this.saveExpenseFromForm(e));
    }

    const customerForm = document.getElementById('customerForm');
    if (customerForm) {
      customerForm.addEventListener('submit', (e) => this.saveCustomerFromForm(e));
    }

    // Product select change updates price in order form
    const orderProdSelect = document.getElementById('orderProductSelect');
    if (orderProdSelect) {
      orderProdSelect.addEventListener('change', (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        const price = opt.getAttribute('data-price');
        if (price) {
          document.getElementById('orderPriceInput').value = price;
        }
      });
    }

    // Responsive Mobile Menu Drawer Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('appSidebar');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
      });
    }
  }

  // Khôi phục dữ liệu mẫu
  resetData() {
    if (confirm('Bạn có muốn khôi phục lại toàn bộ dữ liệu mẫu ban đầu của Yên Paper&Card không? Dữ liệu thêm mới sẽ được làm mới.')) {
      store.resetToSampleData();
    }
  }

  // Render toàn bộ giao diện
  renderAll() {
    this.renderKPIs();
    this.renderOrdersTable();
    this.renderProductsList();
    this.renderCustomersTable();
    this.renderReports();
  }
}

// Khởi tạo ứng dụng
const dashboardApp = new DashboardApp();
document.addEventListener('DOMContentLoaded', () => {
  dashboardApp.init();
});
