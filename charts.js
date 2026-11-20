/**
 * Biểu đồ phân tích kinh doanh (Chart.js Configuration)
 * Yên Paper&Card - Dashboard Điều Hành Doanh Nghiệp
 */

class DashboardCharts {
  constructor() {
    this.revenueChart = null;
    this.categoryChart = null;
    this.topProductsChart = null;
    this.targetVsActualChart = null;
    this.revenueViewMode = 'day'; // 'day', 'week', 'month'
  }

  // Tiện ích format tiền tệ VNĐ
  formatCurrency(value) {
    if (value >= 1000000) {
      return (value / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
    }
    return Number(value).toLocaleString('vi-VN') + ' đ';
  }

  formatFullVND(value) {
    return Number(value).toLocaleString('vi-VN') + ' VNĐ';
  }

  // 1. Biểu đồ Doanh thu (Theo Ngày / Tuần / Tháng)
  initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    let labels = [];
    let dataPoints = [];
    let orderCounts = [];

    if (this.revenueViewMode === 'day') {
      labels = store.data.dailyRevenue.map(d => d.date);
      dataPoints = store.data.dailyRevenue.map(d => d.revenue);
      orderCounts = store.data.dailyRevenue.map(d => d.orders);
    } else if (this.revenueViewMode === 'week') {
      labels = store.data.weeklyRevenue.map(w => w.week);
      dataPoints = store.data.weeklyRevenue.map(w => w.revenue);
      orderCounts = store.data.weeklyRevenue.map(w => w.orders);
    } else {
      labels = store.data.monthlyPerformance.map(m => m.month);
      dataPoints = store.data.monthlyPerformance.map(m => m.actualRevenue);
      orderCounts = store.data.monthlyPerformance.map(m => m.ordersCount);
    }

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)'); // Light blue gradient
    gradient.addColorStop(1, 'rgba(2, 132, 199, 0.01)');

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Doanh thu (VNĐ)',
            data: dataPoints,
            borderColor: '#0284c7', // Sky blue
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#0284c7',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Số đơn hàng',
            data: orderCounts,
            type: 'bar',
            backgroundColor: 'rgba(30, 58, 138, 0.15)', // Navy soft
            hoverBackgroundColor: 'rgba(30, 58, 138, 0.3)',
            borderRadius: 4,
            barThickness: 12,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: { family: "'Inter', sans-serif", size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 0) {
                  return ` Doanh thu: ${this.formatFullVND(context.raw)}`;
                }
                return ` Số lượng: ${context.raw} đơn hàng`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: "'Inter', sans-serif" } }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              callback: (val) => this.formatCurrency(val),
              font: { size: 11 }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (val) => `${val} đơn`,
              font: { size: 10 }
            }
          }
        }
      }
    });
  }

  setRevenueViewMode(mode) {
    this.revenueViewMode = mode;
    this.initRevenueChart();
  }

  // 2. Biểu đồ Cơ cấu đơn hàng theo loại thiệp (Donut Chart)
  initCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const breakdown = store.getCategoryBreakdown();
    const labels = breakdown.map(b => b.label);
    const counts = breakdown.map(b => b.count);
    const colors = [
      '#0284c7', // Sky blue - Cưới
      '#f59e0b', // Amber - Sinh nhật
      '#3b82f6', // Indigo/Blue - Khai trương
      '#8b5cf6', // Violet - Sự kiện
      '#10b981'  // Emerald - Chúc mừng
    ];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 12,
              usePointStyle: true,
              font: { size: 11, family: "'Inter', sans-serif" }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percent = Math.round((context.raw / total) * 100);
                return ` ${context.label}: ${context.raw} đơn (${percent}%)`;
              }
            }
          }
        }
      }
    });

    // Cập nhật legend chi tiết dạng HTML nếu có container
    this.renderCategoryBreakdownList(breakdown);
  }

  renderCategoryBreakdownList(breakdown) {
    const container = document.getElementById('categoryBreakdownList');
    if (!container) return;

    container.innerHTML = breakdown.map(item => `
      <div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
        <div class="flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color}"></span>
          <span class="font-medium text-slate-700">${item.label}</span>
        </div>
        <div class="flex items-center space-x-3">
          <span class="text-slate-500">${item.count} đơn</span>
          <span class="font-semibold text-slate-900 w-10 text-right">${item.percentage}%</span>
        </div>
      </div>
    `).join('');
  }

  // 3. Biểu đồ Sản phẩm thiệp bán chạy nhất (Horizontal Bar Chart)
  initTopProductsChart() {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;

    if (this.topProductsChart) {
      this.topProductsChart.destroy();
    }

    const topProducts = store.getTopSellingProducts(5);
    const labels = topProducts.map(p => p.name.length > 22 ? p.name.substring(0, 20) + '...' : p.name);
    const sales = topProducts.map(p => p.salesCount);
    const revenues = topProducts.map(p => (p.salesCount * p.price));

    this.topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Lượt bán (đơn)',
          data: sales,
          backgroundColor: [
            '#0284c7', // #1
            '#0ea5e9', // #2
            '#38bdf8', // #3
            '#7dd3fc', // #4
            '#bae6fd'  // #5
          ],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => topProducts[items[0].dataIndex].name,
              label: (context) => {
                const p = topProducts[context.dataIndex];
                const rev = (p.salesCount * p.price).toLocaleString('vi-VN');
                return [
                  ` Đã bán: ${p.salesCount} bộ thiệp`,
                  ` Giá bán: ${Number(p.price).toLocaleString('vi-VN')} đ`,
                  ` Tổng doanh thu: ${rev} đ`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              callback: (v) => `${v} đơn`,
              font: { size: 10 }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 11, family: "'Inter', sans-serif", weight: '500' }
            }
          }
        }
      }
    });
  }

  // 4. Biểu đồ So sánh doanh thu thực tế với mục tiêu (Actual vs Target)
  initTargetVsActualChart() {
    const ctx = document.getElementById('targetVsActualChart');
    if (!ctx) return;

    if (this.targetVsActualChart) {
      this.targetVsActualChart.destroy();
    }

    const months = store.data.monthlyPerformance;
    const labels = months.map(m => m.month);
    const actuals = months.map(m => m.actualRevenue);
    const targets = months.map(m => m.targetRevenue);

    this.targetVsActualChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Thực tế đạt được',
            data: actuals,
            backgroundColor: '#0284c7', // Primary Sky Blue
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
          {
            label: 'Mục tiêu KPI (Target)',
            data: targets,
            type: 'line',
            borderColor: '#f59e0b', // Amber line for target
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#f59e0b',
            pointRadius: 3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: { size: 11, family: "'Inter', sans-serif" }
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                const target = targets[context.dataIndex];
                if (context.datasetIndex === 0) {
                  const percent = Math.round((val / target) * 100);
                  return ` Thực tế: ${this.formatFullVND(val)} (${percent}% KPI)`;
                }
                return ` Mục tiêu: ${this.formatFullVND(val)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              callback: (val) => this.formatCurrency(val),
              font: { size: 10 }
            }
          }
        }
      }
    });
  }

  // Khởi tạo và làm mới tất cả các biểu đồ
  renderAll() {
    this.initRevenueChart();
    this.initCategoryChart();
    this.initTopProductsChart();
    this.initTargetVsActualChart();
  }
}

const dashboardCharts = new DashboardCharts();
