
// Global variables cho pagination 
let globalCurrentPage = 1;
let globalTotalPages = 1;
let globalCurrentLimit = 5;

// Hàm render pagination
function renderPaginationCommon(paginationData, fetchFunctionName) {
  const currentPage = paginationData.currentPage || 1;
  const totalPages = paginationData.totalPages || paginationData.totalPage || 1;
  const totalItems = paginationData.totalItems || 0;
  const limitItem = paginationData.limitItem || 5;

  const pagination = document.getElementById("pagination");
  const paginationInfo = document.getElementById("paginationInfo");
  
  // Kiểm tra element có tồn tại không
  if (!pagination) {
    console.warn("Pagination element not found");
    return;
  }

  pagination.innerHTML = "";

  // Nếu chỉ có 1 trang thì không cần hiển thị pagination
  if (totalPages <= 1) {
    return;
  }

  // Nút First
  pagination.innerHTML += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="${fetchFunctionName}(1)" title="Trang đầu">First</a>
    </li>
  `;

  // Nút Previous
  pagination.innerHTML += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="${fetchFunctionName}(${currentPage - 1})" title="Trang trước">Previous</a>
    </li>
  `;

  // Các số trang (hiển thị tối đa 5 số)
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  // Hiển thị "..." nếu có nhiều trang ở đầu
  if (startPage > 1) {
    pagination.innerHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="${fetchFunctionName}(1)">1</a>
      </li>
    `;
    if (startPage > 2) {
      pagination.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pagination.innerHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" href="#" onclick="${fetchFunctionName}(${i})">${i}</a>
      </li>
    `;
  }

  // Hiển thị "..." nếu có nhiều trang ở cuối
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pagination.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    pagination.innerHTML += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="${fetchFunctionName}(${totalPages})">${totalPages}</a>
      </li>
    `;
  }

  // Nút Next
  pagination.innerHTML += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="${fetchFunctionName}(${currentPage + 1})" title="Trang sau">Next</a>
    </li>
  `;

  // Nút Last
  pagination.innerHTML += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="${fetchFunctionName}(${totalPages})" title="Trang cuối">Last</a>
    </li>
  `;
}

// Hàm hiển thị loading 
function showLoadingCommon(show, elementId = 'loading') {
  const loadingEl = document.getElementById(elementId);
  if (loadingEl) {
    loadingEl.style.display = show ? 'block' : 'none';
  }
}

// Hàm hiển thị/ẩn bảng khi không có dữ liệu
function toggleNoDataCommon(show, tableSelector = '.table-responsive', noDataSelector = '#noData') {
  const tableEl = document.querySelector(tableSelector);
  const noDataEl = document.querySelector(noDataSelector);
  
  if (tableEl) {
    tableEl.style.display = show ? 'none' : 'block';
  }
  if (noDataEl) {
    noDataEl.style.display = show ? 'block' : 'none';
  }
}

//Xử lý khi người dùng nhập số bản ghi và nhấn Enter
function handleLimitInputEnterCommon(event, limitInputId, fetchCallback) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleLimitChangeCommon(limitInputId, fetchCallback);
  }
}

//Xử lý khi người dùng thay đổi số bản ghi trên trang
function handleLimitChangeCommon(limitInputId, fetchCallback) {
  const limitInput = document.getElementById(limitInputId);
  const inputLimit = parseInt(limitInput.value);
  
  // Validate input
  if (isNaN(inputLimit) || inputLimit < 1) {
    alert("Vui lòng nhập số bản ghi hợp lệ (từ 1 trở lên)");
    limitInput.value = globalCurrentLimit; // Reset về limit hiện tại
    return;
  }
  
  if (inputLimit > 1000) {
    alert("Số bản ghi tối đa là 1000 để đảm bảo hiệu suất");
    limitInput.value = globalCurrentLimit; // Reset về limit hiện tại
    return;
  }
  
  // Apply new limit
  globalCurrentLimit = inputLimit;
  // console.log(`Đã thay đổi limit thành: ${globalCurrentLimit}`);
  
  // Reset về trang 1 và fetch lại data
  globalCurrentPage = 1;
  updatePageInputCommon(); // Cập nhật input trang
  
  // Call fetch function
  if (typeof fetchCallback === 'function') {
    fetchCallback(1);
  } else if (typeof window[fetchCallback] === 'function') {
    window[fetchCallback](1);
  }
}

//Xử lý khi người dùng nhập số trang và nhấn Enter
function handlePageInputEnterCommon(event, fetchCallback) {
  if (event.key === 'Enter') {
    event.preventDefault();
    goToPageCommon(fetchCallback);
  }
}

//Đi đến trang mà người dùng nhập
function goToPageCommon(fetchCallback, pageInputId = 'pageInput') {
  const pageInput = document.getElementById(pageInputId);
  const inputPage = parseInt(pageInput.value);
  
  // Validate input
  if (isNaN(inputPage) || inputPage < 1) {
    alert("Vui lòng nhập số trang hợp lệ (từ 1 trở lên)");
    pageInput.value = globalCurrentPage; // Reset về trang hiện tại
    return;
  }
  
  if (inputPage > globalTotalPages) {
    alert(`Trang ${inputPage} không tồn tại. Tổng cộng có ${globalTotalPages} trang.`);
    pageInput.value = globalCurrentPage; // Reset về trang hiện tại
    return;
  }
  
  // Đi đến trang hợp lệ
  console.log(`Đi đến trang: ${inputPage}`);
  
  // Call fetch function
  if (typeof fetchCallback === 'function') {
    fetchCallback(inputPage);
  } else if (typeof window[fetchCallback] === 'function') {
    window[fetchCallback](inputPage);
  }
}

//Cập nhật input trang theo trang hiện tại
function updatePageInputCommon(pageInputId = 'pageInput') {
  const pageInput = document.getElementById(pageInputId);
  if (pageInput) {
    pageInput.value = globalCurrentPage;
    pageInput.max = globalTotalPages; // Set max attribute
  }
}

// Reset filters
function resetFiltersCommon(filters, fetchCallback) {
  // Reset form inputs
  Object.keys(filters).forEach(key => {
    const element = document.getElementById(filters[key].id);
    if (element) {
      element.value = filters[key].defaultValue || "";
    }
  });
  
  // Reset pagination
  globalCurrentLimit = 5;
  globalCurrentPage = 1;
  updatePageInputCommon();
  
  // Call fetch function
  if (typeof fetchCallback === 'function') {
    fetchCallback(1);
  } else if (typeof window[fetchCallback] === 'function') {
    window[fetchCallback](1);
  }
}

//Cập nhật global variables
function updateGlobalPaginationVars(currentPage, totalPages, currentLimit) {
  globalCurrentPage = currentPage;
  globalTotalPages = totalPages;
  if (currentLimit) {
    globalCurrentLimit = currentLimit;
  }
}

//Get current limit from input
function getCurrentLimitFromInput(limitInputId = 'limitInput') {
  const limitInput = document.getElementById(limitInputId);
  return limitInput ? parseInt(limitInput.value) || globalCurrentLimit : globalCurrentLimit;
}