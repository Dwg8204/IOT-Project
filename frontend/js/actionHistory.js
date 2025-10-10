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
  if (event.key === 'Enter') {
    event.preventDefault();
    applyFilters();
  }
}

function handleLimitChange() {
  applyFilters();
}

// Hàm áp dụng tất cả filters
function applyFilters() {
  const limitInput = document.getElementById('limitInput');
  const inputLimit = parseInt(limitInput.value);
  
  if (isNaN(inputLimit) || inputLimit < 1) {
    alert("Vui lòng nhập số bản ghi hợp lệ (từ 1 trở lên)");
    limitInput.value = currentLimit;
    return;
  }
  
  if (inputLimit > 1000) {
    alert("Số bản ghi tối đa là 1000 để đảm bảo hiệu suất");
    limitInput.value = currentLimit;
    return;
  }
  
  const applyButton = document.getElementById('applyButton');
  if (applyButton) {
    const originalText = applyButton.innerHTML;
    applyButton.innerHTML = '<i class="spinner-border spinner-border-sm"></i> Đang áp dụng...';
    applyButton.disabled = true;
    
    setTimeout(() => {
      applyButton.innerHTML = originalText;
      applyButton.disabled = false;
    }, 1000);
  }
  
  currentLimit = inputLimit;
  globalCurrentLimit = inputLimit;
  globalCurrentPage = 1;
  currentPage = 1;
  
  fetchData(1);
}

function handlePageInputEnter(event) {
  handlePageInputEnterCommon(event, 'fetchData');
}

function goToPage() {
  goToPageCommon('fetchData');
}

function updatePageInput() {
  updatePageInputCommon();
}

// Copy time functions
function copyTimeToClipboard(timeString, element) {
  if (!timeString || timeString === '--') {
    showToast('⚠️ Không có thời gian để copy!', 'warning');
    return;
  }

  try {
    navigator.clipboard.writeText(timeString).then(() => {
      showToast('✅ Đã copy thời gian: ' + timeString, 'success');
      
      element.classList.add('copied');
      setTimeout(() => {
        element.classList.remove('copied');
      }, 1000);
      
      const searchInput = document.getElementById('searchKeyword');
      if (searchInput) {
        searchInput.value = timeString;
        searchInput.focus();
        
        searchInput.classList.add('highlight');
        setTimeout(() => {
          searchInput.classList.remove('highlight');
        }, 1000);
      }
      
    }).catch(err => {
      console.error('Lỗi copy:', err);
      fallbackCopyTextToClipboard(timeString, element);
    });
  } catch (err) {
    console.error('Clipboard API không được hỗ trợ:', err);
    fallbackCopyTextToClipboard(timeString, element);
  }
}

function fallbackCopyTextToClipboard(text, element) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('✅ Đã copy thời gian: ' + text, 'success');
      
      element.classList.add('copied');
      setTimeout(() => {
        element.classList.remove('copied');
      }, 1000);
      
      const searchInput = document.getElementById('searchKeyword');
      if (searchInput) {
        searchInput.value = text;
        searchInput.focus();
        searchInput.classList.add('highlight');
        setTimeout(() => {
          searchInput.classList.remove('highlight');
        }, 1000);
      }
    } else {
      showToast('❌ Không thể copy thời gian!', 'error');
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
    showToast('❌ Không thể copy thời gian!', 'error');
  }
  
  document.body.removeChild(textArea);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
        <i class="bi bi-x"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Hàm cập nhật sort indicators
function updateSortIndicators(sortOrder) {
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    indicator.innerHTML = '';
  });
  
  const indicator = document.getElementById('timeSortIndicator');
  if (indicator) {
    indicator.innerHTML = sortOrder === '1' ? ' ↑' : ' ↓';
    indicator.style.color = '#8c52ff';
    indicator.style.fontWeight = 'bold';
  }
}

async function fetchData(page = 1) {
  currentPage = page;
  showLoading(true);

  const keyword = document.getElementById("searchKeyword").value.trim();
  const deviceFilter = document.getElementById("deviceFilter").value;
  const sortOrder = document.getElementById("sortOrder").value;
  
  currentLimit = getCurrentLimitFromInput('limitInput');

  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", currentLimit);
  
  if (keyword) params.append("keyword", keyword);
  if (deviceFilter) params.append("device", deviceFilter);
  
  // Sort theo thời gian
  params.append("sortKey", "createAt");
  params.append("sortValue", sortOrder);

  const url = `http://localhost:3000/api/action-history?${params.toString()}`;
  console.log("Fetch URL:", url);
  console.log("Filter params:", { keyword, deviceFilter, sortOrder });

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log("API Response:", result);

    if (result.data && result.pagination) {
      // 🔹 THÊM: Truyền pagination info để tính STT
      renderTable(result.data, result.pagination);
      
      renderPaginationCommon(result.pagination, 'fetchData');
      
      currentPage = result.pagination.currentPage || 1;
      totalPages = result.pagination.totalPages || result.pagination.totalPage || 1;
      updateGlobalPaginationVars(currentPage, totalPages, currentLimit);
      
      updatePageInput();
      
      // Cập nhật sort indicators
      updateSortIndicators(sortOrder);
      
    } else if (Array.isArray(result)) {
      renderTable(result, { currentPage: 1, limitItem: result.length });
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
    showToast("Lỗi khi tải action history: " + err.message, 'error');
    renderTable([]);
  } finally {
    showLoading(false);
  }
}

// 🔹 SỬA: Hàm render table với số thứ tự
function renderTable(data, pagination = null) {
  const tbody = document.getElementById("historyTable");
  tbody.innerHTML = "";

  if (!data || !data.length) {
    toggleNoDataCommon(true);
    return;
  }
  
  toggleNoDataCommon(false);

  // 🔹 Tính số thứ tự bắt đầu
  let startIndex = 1;
  if (pagination) {
    const currentPage = pagination.currentPage || 1;
    const limitItem = pagination.limitItem || currentLimit;
    startIndex = (currentPage - 1) * limitItem + 1;
  }

  data.forEach((row, idx) => {
    const tr = document.createElement("tr");

    // 🔹 SỬA: Tính số thứ tự
    const rowNumber = startIndex + idx;
    
    const deviceName = deviceNames[row.device] || row.device;
    const timeStr = row.createAt || row.createdAt;
    
    let timeFormatted = "--";
    if (timeStr) {
      const date = new Date(timeStr);
      timeFormatted = date.toLocaleString("vi-VN");
    }
    
    // Action badge
    const actionBadge = row.action === 'on' 
      ? '<span class="badge bg-success">Bật</span>' 
      : '<span class="badge bg-secondary">Tắt</span>';
    
    // Status badge
    // let statusBadge = '';
    // if (row.status === 'ok') {
    //   statusBadge = '<span class="badge bg-success">OK</span>';
    // } else if (row.status === 'error') {
    //   statusBadge = '<span class="badge bg-danger">Error</span>';
    // } else {
    //   statusBadge = `<span class="badge bg-secondary">${row.status || 'N/A'}</span>`;
    // }

    tr.innerHTML = `
      <td class="fw-bold text-dark text-center">
        ${rowNumber}
      </td>
      <td>
        ${deviceName}
      </td>
      <td>${actionBadge}</td>
      <td class="time-cell copyable" title="Double-click để copy thời gian" ondblclick="copyTimeToClipboard('${timeFormatted}', this)">
        <i class="bi bi-clock me-1"></i>
        ${timeFormatted}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function resetFilters() {
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    const originalText = resetButton.innerHTML;
    resetButton.innerHTML = '<i class="spinner-border spinner-border-sm"></i> Đang reset...';
    resetButton.disabled = true;
    
    setTimeout(() => {
      resetButton.innerHTML = originalText;
      resetButton.disabled = false;
    }, 1000);
  }
  
  // Reset form values
  document.getElementById('searchKeyword').value = '';
  document.getElementById('deviceFilter').value = '';
  document.getElementById('sortOrder').value = '-1';
  document.getElementById('limitInput').value = '5';
  
  // Reset pagination variables
  currentLimit = 5;
  currentPage = 1;
  globalCurrentLimit = 5;
  globalCurrentPage = 1;
  updatePageInputCommon();
  
  // Clear sort indicators
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    indicator.innerHTML = '';
  });
  
  // Fetch data với filters đã reset
  fetchData(1);
}

// Event listeners
document.addEventListener("DOMContentLoaded", function() {
  
  // Tìm kiếm khi nhấn Enter trong search box
  const searchInput = document.getElementById("searchKeyword");
  if (searchInput) {
    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    });
  }

  // Validation cho limit input (không auto-apply)
  const limitInput = document.getElementById("limitInput");
  if (limitInput) {
    limitInput.addEventListener("input", function() {
      const inputLimit = parseInt(this.value);
      if (isNaN(inputLimit) || inputLimit < 1 || inputLimit > 1000) {
        this.classList.add('is-invalid');
      } else {
        this.classList.remove('is-invalid');
      }
    });
  }

  // Set giá trị mặc định
  document.getElementById("limitInput").value = "5";
  document.getElementById("sortOrder").value = "-1";
  currentLimit = 5;
  updateGlobalPaginationVars(1, 1, 5);

  // Load data lần đầu
  console.log("📊 Loading initial action history data...");
  fetchData(1);
});