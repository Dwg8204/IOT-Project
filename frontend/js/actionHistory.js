
let currentPage = 1;
let totalPages = 1;
let currentLimit = 5; 

const deviceNames = {
  'light': 'Đèn',
  'fan': 'Quạt',
  'air': 'Điều hòa'
};

function showLoading(show) {
  showLoadingCommon(show);
}

//Xử lý khi người dùng nhập số bản ghi và nhấn Enter
function handleLimitInputEnter(event) {
  handleLimitInputEnterCommon(event, 'limitInput', 'fetchData');
}

//Xử lý khi người dùng thay đổi số bản ghi trên trang
function handleLimitChange() {
  handleLimitChangeCommon('limitInput', 'fetchData');
  // Sync với local variables
  currentLimit = globalCurrentLimit;
}

// lý khi người dùng nhập số trang và nhấn Enter
function handlePageInputEnter(event) {
  handlePageInputEnterCommon(event, 'fetchData');
}

//Đi đến trang mà người dùng nhập
function goToPage() {
  goToPageCommon('fetchData');
}

//Cập nhật input trang theo trang hiện tại
function updatePageInput() {
  updatePageInputCommon();
}

async function fetchData(page = 1) {
  currentPage = page;
  showLoading(true);

  const keyword = document.getElementById("searchKeyword").value.trim();
  const device = document.getElementById("deviceFilter").value;
  const sortOrder = document.getElementById("sortOrder").value;
  
  // Lấy current limit từ input hoặc biến global
  currentLimit = getCurrentLimitFromInput('limitInput');

  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", currentLimit);
  
  if (keyword) params.append("keyword", keyword);
  if (device) params.append("device", device);
  
  if (sortOrder) {
    params.append("sortKey", "createAt");
    params.append("sortValue", sortOrder);
  }

  const url = `http://localhost:3000/api/action-history?${params.toString()}`;
  console.log("Fetch URL:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log("API Response:", result);

    if (result.data && result.pagination) {
      renderTable(result.data);
      
      renderPaginationCommon(result.pagination, 'fetchData');
      
      // Cập nhật biến local và global
      currentPage = result.pagination.currentPage || 1;
      totalPages = result.pagination.totalPages || result.pagination.totalPage || 1;
      updateGlobalPaginationVars(currentPage, totalPages, currentLimit);
      
      // Cập nhật input trang
      updatePageInput();
      
    } else if (Array.isArray(result)) {
      renderTable(result);
      renderPaginationCommon({
        currentPage: 1,
        totalPages: 1,
        totalItems: result.length,
        limitItem: result.length
      }, 'fetchData');
      
      currentPage = 1;
      totalPages = 1;
      updateGlobalPaginationVars(currentPage, totalPages, currentLimit);
      updatePageInput();
    } else {
      console.warn("Unknown response format:", result);
      renderTable([]);
    }

  } catch (err) {
    console.error("Fetch error:", err);
    alert("Lỗi khi tải dữ liệu: " + err.message);
    renderTable([]);
  } finally {
    showLoading(false);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("historyTable");
  tbody.innerHTML = "";

  if (!data || !data.length) {
    toggleNoDataCommon(true);
    return;
  }
  
  toggleNoDataCommon(false);

  data.forEach((row, idx) => {
    const tr = document.createElement("tr");

    const deviceName = deviceNames[row.device] || row.device;
    const actionText = row.action === "on" ? "Bật" : "Tắt";
    const timeStr = row.createAt || row.createdAt;
    
    let timeFormatted = "--";
    if (timeStr) {
      const date = new Date(timeStr);
      timeFormatted = date.toLocaleString("vi-VN");
    }
    
    let statusBadge = '';
    if (row.status === 'ok') {
      statusBadge = '<span class="badge bg-success">OK</span>';
    } else if (row.status === 'error') {
      statusBadge = '<span class="badge bg-danger">Error</span>';
    } else {
      statusBadge = `<span class="badge bg-secondary">${row.status || 'N/A'}</span>`;
    }

    tr.innerHTML = `
      <td>${(currentPage - 1) * currentLimit + idx + 1}</td>
      <td>${deviceName}</td>
      <td><span class="${row.action === 'on' ? 'text-success' : 'text-danger'}">${actionText}</span></td>
      <td>${statusBadge}</td>
      <td>${timeFormatted}</td>
    `;
    tbody.appendChild(tr);
  });
}

//Reset filters
function resetFilters() {
  const filters = {
    searchKeyword: { id: 'searchKeyword', defaultValue: '' },
    deviceFilter: { id: 'deviceFilter', defaultValue: '' },
    sortOrder: { id: 'sortOrder', defaultValue: '-1' },
    limitInput: { id: 'limitInput', defaultValue: '5' }
  };
  
  resetFiltersCommon(filters, 'fetchData');
  
  // Sync với local variables
  currentLimit = 5;
  currentPage = 1;
}

// Event listeners
document.addEventListener("DOMContentLoaded", function() {
  // Tìm kiếm sau khi enter
  document.getElementById("searchKeyword").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchData(1);
    }
  });

  // Set giá trị mặc định
  document.getElementById("limitInput").value = "5";
  currentLimit = 5;
  updateGlobalPaginationVars(1, 1, 5);

  // Load data lần đầu
  fetchData(1);
});