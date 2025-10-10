let currentPage = 1;
let totalPages = 1;
let currentLimit = 5;

// Sử dụng hàm showLoadingCommon từ script.js
function showLoading(show) {
  showLoadingCommon(show);
}
// Cập nhật placeholder khi đổi loại tìm kiếm
function updateSearchPlaceholder() {
  const searchType = document.getElementById('searchType').value;
  const searchInput = document.getElementById('searchKeyword');
  
  const placeholders = {
    'time': 'Nhập thời gian (VD: 10:30:45 7/10/2025)',
    'temperature': 'Nhập nhiệt độ (VD: 28.5)',
    'humidity': 'Nhập độ ẩm (VD: 65)',
    'light': 'Nhập ánh sáng (VD: 320)'
  };
  
  searchInput.placeholder = placeholders[searchType];
  searchInput.value = ''; // Clear input khi đổi type
}
function validateSearchInput(keyword, searchType) {
  if (!keyword || keyword.trim() === '') {
    return { valid: true }; // Cho phép search rỗng (lấy tất cả)
  }

  const trimmedKeyword = keyword.trim();

  if (searchType === 'time') {
    // ✅ Validate thời gian (có thể là bất kỳ format nào)
    // Backend sẽ parse, ở đây chỉ check không phải là số thuần
    const isOnlyNumber = /^\d+(\.\d+)?$/.test(trimmedKeyword);
    
    if (isOnlyNumber) {
      return {
        valid: false,
        message: '⚠️ Loại tìm kiếm "Thời gian" không nhận giá trị số đơn thuần.\nVui lòng nhập theo định dạng: "7/10/2025" hoặc "10:30:45 7/10/2025"'
      };
    }
    
    return { valid: true };
    
  } else if (searchType === 'temperature' || searchType === 'humidity' || searchType === 'light') {
    // ✅ Validate số (temperature, humidity, light)
    const numericValue = parseFloat(trimmedKeyword);
    
    if (isNaN(numericValue)) {
      const typeNames = {
        'temperature': 'Nhiệt độ',
        'humidity': 'Độ ẩm',
        'light': 'Ánh sáng'
      };
      
      return {
        valid: false,
        message: `⚠️ Loại tìm kiếm "${typeNames[searchType]}" chỉ nhận giá trị số.\nVui lòng nhập một số hợp lệ (VD: ${searchType === 'temperature' ? '28.5' : searchType === 'humidity' ? '65' : '320'})`
      };
    }
    
    // ✅ Thêm validation range cho từng loại
    if (searchType === 'temperature') {
      if (numericValue < -50 || numericValue > 100) {
        return {
          valid: false,
          message: '⚠️ Nhiệt độ phải trong khoảng -50°C đến 100°C'
        };
      }
    } else if (searchType === 'humidity') {
      if (numericValue < 0 || numericValue > 100) {
        return {
          valid: false,
          message: '⚠️ Độ ẩm phải trong khoảng 0% đến 100%'
        };
      }
    } else if (searchType === 'light') {
      if (numericValue < 0) {
        return {
          valid: false,
          message: '⚠️ Ánh sáng không thể là số âm'
        };
      }
    }
    
    return { valid: true };
  }

  return { valid: true };
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
  // Validate search input
  const keyword = document.getElementById('searchKeyword').value.trim();
  const searchType = document.getElementById('searchType').value;
  
  if (keyword) {
    const validation = validateSearchInput(keyword, searchType);
    
    if (!validation.valid) {
      alert(validation.message);
      return; // Dừng lại nếu validation thất bại
    }
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
function updateSortIndicators(sortKey, sortOrder) {
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    indicator.innerHTML = '';
  });
  
  const indicatorMap = {
    'createdAt': 'timeSortIndicator',
    'temperature': 'tempSortIndicator',
    'humidity': 'humSortIndicator',
    'light': 'lightSortIndicator'
  };
  
  const indicatorId = indicatorMap[sortKey];
  const indicator = document.getElementById(indicatorId);
  
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
  const searchType = document.getElementById("searchType").value;
  const sortKey = document.getElementById("sortKey").value;
  const sortOrder = document.getElementById("sortOrder").value;
  
  currentLimit = getCurrentLimitFromInput('limitInput');

  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", currentLimit);
  
  // 🔹 THÊM: Gửi searchType và keyword
  if (keyword) {
    params.append("keyword", keyword);
    params.append("searchType", searchType);
  }
  
  params.append("sortKey", sortKey);
  params.append("sortValue", sortOrder);

  const url = `http://localhost:3000/api/data-sensor?${params.toString()}`;
  console.log("Fetch URL:", url);
  console.log("Filter params:", { keyword, searchType, sortKey, sortOrder });

  try {
    const res = await fetch(url);
    // Xử lý lỗi validation từ backend
    if (res.status === 400) {
      const errorData = await res.json();
      alert(`${errorData.message}\n\n💡 ${errorData.hint || ''}`);
      showLoading(false);
      return;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log("API Response:", result);

    if (result.data && result.pagination) {
      renderTable(result.data, result.pagination);
      
      renderPaginationCommon(result.pagination, 'fetchData');
      
      currentPage = result.pagination.currentPage || 1;
      totalPages = result.pagination.totalPages || result.pagination.totalPage || 1;
      updateGlobalPaginationVars(currentPage, totalPages, currentLimit);
      
      updatePageInput();
      updateSortIndicators(sortKey, sortOrder);
      
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
    showToast("Lỗi khi tải dữ liệu sensor: " + err.message, 'error');
    renderTable([]);
  } finally {
    showLoading(false);
  }
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
  
  document.getElementById('searchKeyword').value = '';
  document.getElementById('sortKey').value = 'createdAt';
  document.getElementById('sortOrder').value = '-1';
  document.getElementById('limitInput').value = '5';
  
  currentLimit = 5;
  currentPage = 1;
  globalCurrentLimit = 5;
  globalCurrentPage = 1;
  updatePageInputCommon();
  
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    indicator.innerHTML = '';
  });
  
  fetchData(1);
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("searchKeyword").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  });

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

  document.getElementById("limitInput").value = "5";
  document.getElementById("sortKey").value = "createdAt";
  document.getElementById("sortOrder").value = "-1";
  currentLimit = 5;
  updateGlobalPaginationVars(1, 1, 5);

  console.log("📊 Loading initial sensor data...");
  fetchData(1);
});

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
      <td class="fw-bold text-primary text-center">
        ${rowNumber}
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
// function resetFilters() {
//   document.getElementById('searchKeyword').value = '';
//   document.getElementById('deviceFilter').value = '';
//   document.getElementById('sortOrder').value = '-1';
//   document.getElementById('limitInput').value = '5';
  
//   // Reset pagination variables
//   currentLimit = 5;
//   currentPage = 1;
//   globalCurrentLimit = 5;
//   globalCurrentPage = 1;
//   updatePageInputCommon();
  
//   // Clear sort indicators
//   document.querySelectorAll('.sort-indicator').forEach(indicator => {
//     indicator.innerHTML = '';
//   });
  
//   // Fetch data với filters đã reset
//   fetchData(1);
// }

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