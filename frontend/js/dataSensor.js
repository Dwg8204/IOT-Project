let currentPage = 1;
let totalPages = 1;
let currentLimit = 5;

// Sử dụng hàm showLoadingCommon từ script.js
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

// Hàm áp dụng tất cả filter
function applyFilters() {
  // Validate limit input
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
  
  // Cập nhật limit và reset về trang 1
  currentLimit = inputLimit;
  globalCurrentLimit = inputLimit;
  globalCurrentPage = 1;
  currentPage = 1;
  
  fetchData(1);
}

//Xử lý khi người dùng nhập số trang và nhấn Enter
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

// THÊM MỚI: Hàm copy thời gian khi double-click
function copyTimeToClipboard(timeString, element) {
  // Kiểm tra xem có phải thời gian hợp lệ không
  if (!timeString || timeString === '--') {
    showToast('⚠️ Không có thời gian để copy!', 'warning');
    return;
  }

  try {
    // Copy vào clipboard
    navigator.clipboard.writeText(timeString).then(() => {
      // Hiển thị thông báo thành công
      showToast('✅ Đã copy thời gian: ' + timeString, 'success');
      
      // Hiệu ứng visual cho ô được copy
      element.classList.add('copied');
      setTimeout(() => {
        element.classList.remove('copied');
      }, 1000);
      
      // Tự động paste vào search box (tùy chọn)
      const searchInput = document.getElementById('searchKeyword');
      if (searchInput) {
        searchInput.value = timeString;
        searchInput.focus();
        
        // Hiệu ứng highlight search input
        searchInput.classList.add('highlight');
        setTimeout(() => {
          searchInput.classList.remove('highlight');
        }, 1000);
      }
      
    }).catch(err => {
      console.error('Lỗi copy:', err);
      // Fallback cho trình duyệt cũ
      fallbackCopyTextToClipboard(timeString, element);
    });
  } catch (err) {
    console.error('Clipboard API không được hỗ trợ:', err);
    // Fallback cho trình duyệt cũ
    fallbackCopyTextToClipboard(timeString, element);
  }
}

// THÊM MỚI: Fallback copy cho trình duyệt cũ
function fallbackCopyTextToClipboard(text, element) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Tránh scroll khi thêm textarea
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
      
      // Hiệu ứng visual
      element.classList.add('copied');
      setTimeout(() => {
        element.classList.remove('copied');
      }, 1000);
      
      // Auto paste vào search
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

// THÊM MỚI: Hiển thị toast notification
function showToast(message, type = 'info') {
  // Tạo toast element
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
  
  // Thêm vào body
  document.body.appendChild(toast);
  
  // Animation show
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Auto remove sau 3 giây
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
  // Clear all indicators
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    indicator.innerHTML = '';
  });
  
  // Chỉ hiển thị indicator cho thời gian
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
  
  // Lấy current limit từ input hoặc biến global
  currentLimit = getCurrentLimitFromInput('limitInput');

  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", currentLimit);
  
  if (keyword) params.append("keyword", keyword);
  
  // Filter theo sensor type
  if (deviceFilter) {
    params.append("sensorType", deviceFilter);
  }
  
  // Sort theo thời gian
  params.append("sortKey", "createdAt");
  params.append("sortValue", sortOrder);

  const url = `http://localhost:3000/api/data-sensor?${params.toString()}`;
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
      renderTable(result.data);
      
      renderPaginationCommon(result.pagination, 'fetchData');
      
      // Cập nhật biến local và global
      currentPage = result.pagination.currentPage || 1;
      totalPages = result.pagination.totalPages || result.pagination.totalPage || 1;
      updateGlobalPaginationVars(currentPage, totalPages, currentLimit);
      
      // Cập nhật input trang
      updatePageInput();
      
      // Cập nhật sort indicators
      updateSortIndicators(sortOrder);
      
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
    alert("Lỗi khi tải dữ liệu sensor: " + err.message);
    renderTable([]);
  } finally {
    showLoading(false);
  }
}

// Hàm render table cho sensor data
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

    // Lấy ID thực từ database
    const recordId = row._id || row.id || '--';
    
    // Render sensor data
    const tempValue = row.temperature || '--';
    const humValue = row.humidity || '--';
    const lightValue = row.light || '--';
    
    // Format thời gian
    const timeStr = row.createdAt || row.createAt;
    let timeFormatted = "--";
    if (timeStr) {
      const date = new Date(timeStr);
      timeFormatted = date.toLocaleString("vi-VN");
    }

    const valueClass = 'text-dark';
    const noDataClass = 'text-muted';

    tr.innerHTML = `
      <td class="fw-bold text-dark" title="Database ID: ${recordId}">
        ${recordId !== '--' ? recordId.toString().slice(-6) : '--'}
      </td>
      <td class="${tempValue !== '--' ? valueClass : noDataClass}">
        ${tempValue !== '--' ? tempValue + '°C' : '--'}
      </td>
      <td class="${humValue !== '--' ? valueClass : noDataClass}">
        ${humValue !== '--' ? humValue + '%' : '--'}
      </td>
      <td class="${lightValue !== '--' ? valueClass : noDataClass}">
        ${lightValue !== '--' ? lightValue + ' Lux' : '--'}
      </td>
      <td class="time-cell copyable" title="Double-click để copy thời gian" ondblclick="copyTimeToClipboard('${timeFormatted}', this)">
        <i class="bi bi-clock me-1"></i>
        ${timeFormatted}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Reset filters
function resetFilters() {
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
  // Tìm kiếm sau khi enter
  document.getElementById("searchKeyword").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  });

  // Set giá trị mặc định
  document.getElementById("limitInput").value = "5";
  document.getElementById("sortOrder").value = "-1";
  currentLimit = 5;
  updateGlobalPaginationVars(1, 1, 5);

  // Load data lần đầu
  fetchData(1);
});