module.exports = (query) => {
  let objectSearch = {
    keyword: "",
    regex: null,
    timeSearch: null
  };

  if (query.keyword) {
    objectSearch.keyword = query.keyword;

    // 🔹 THÊM: Xử lý nhiều định dạng thời gian
    const timeFormats = parseMultipleTimeFormats(query.keyword);
    
    if (timeFormats.length > 0) {
      console.log('✅ Detected time search with formats:', timeFormats);
      
      // Tạo $or query cho tất cả các format phù hợp
      objectSearch.timeSearch = {
        $or: timeFormats.map(({ start, end }) => ({
          $gte: start,
          $lte: end
        }))
      };
    } else {
      // Không phải time search, dùng regex thông thường
      const regex = new RegExp(query.keyword, "i");
      objectSearch.regex = regex;
    }
  }

  return objectSearch;
};

// 🔹 HÀM MỚI: Parse nhiều định dạng thời gian
function parseMultipleTimeFormats(keyword) {
  const results = [];
  const trimmed = keyword.trim();
  
  // 1️⃣ Format: "3/10/2025" hoặc "03/10/2025" (DD/MM/YYYY)
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  let match = trimmed.match(ddmmyyyyRegex);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    
    if (isValidDate(day, month, year)) {
      const start = new Date(year, month, day, 0, 0, 0, 0);
      const end = new Date(year, month, day, 23, 59, 59, 999);
      
      results.push({ start, end, format: 'DD/MM/YYYY' });
      console.log(`✅ Parsed DD/MM/YYYY: ${day}/${month + 1}/${year}`);
    }
  }
  
  // 2️⃣ Format: "3/10/2025, 17:30:45" (DD/MM/YYYY, HH:MM:SS)
  const fullVNRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2}):(\d{2})$/;
  match = trimmed.match(fullVNRegex);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);
    const second = parseInt(match[6]);
    
    if (isValidDate(day, month, year) && isValidTime(hour, minute, second)) {
      const exactTime = new Date(year, month, day, hour, minute, second);
      const start = new Date(exactTime.getTime() - 1000);
      const end = new Date(exactTime.getTime() + 1000);
      
      results.push({ start, end, format: 'DD/MM/YYYY, HH:MM:SS' });
      console.log(`✅ Parsed DD/MM/YYYY, HH:MM:SS: ${day}/${month + 1}/${year} ${hour}:${minute}:${second}`);
    }
  }
  
  // 🔹 MỚI 3️⃣ Format: "09:12:42 3/10/2025" (HH:MM:SS DD/MM/YYYY - Thời gian trước)
  const timeFirstRegex = /^(\d{1,2}):(\d{2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  match = trimmed.match(timeFirstRegex);
  if (match) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const second = parseInt(match[3]);
    const day = parseInt(match[4]);
    const month = parseInt(match[5]) - 1;
    const year = parseInt(match[6]);
    
    if (isValidDate(day, month, year) && isValidTime(hour, minute, second)) {
      const exactTime = new Date(year, month, day, hour, minute, second);
      const start = new Date(exactTime.getTime() - 1000);
      const end = new Date(exactTime.getTime() + 1000);
      
      results.push({ start, end, format: 'HH:MM:SS DD/MM/YYYY' });
      console.log(`✅ Parsed HH:MM:SS DD/MM/YYYY: ${hour}:${minute}:${second} ${day}/${month + 1}/${year}`);
    }
  }
  
  // 4️⃣ Format: "2025-10-03" (ISO date only)
  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  match = trimmed.match(isoDateRegex);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    
    if (isValidDate(day, month, year)) {
      const start = new Date(year, month, day, 0, 0, 0, 0);
      const end = new Date(year, month, day, 23, 59, 59, 999);
      
      results.push({ start, end, format: 'YYYY-MM-DD' });
      console.log(`✅ Parsed YYYY-MM-DD: ${year}-${month + 1}-${day}`);
    }
  }
  
  // 5️⃣ Format: "2025-10-03T17:30:45" hoặc "2025-10-03T17:30:45.000Z" (Full ISO)
  const isoFullRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
  match = trimmed.match(isoFullRegex);
  if (match) {
    try {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        const start = new Date(parsedDate.getTime() - 1000);
        const end = new Date(parsedDate.getTime() + 1000);
        
        results.push({ start, end, format: 'ISO Full' });
        console.log(`✅ Parsed ISO Full: ${parsedDate.toISOString()}`);
      }
    } catch (e) {
      console.warn('Invalid ISO format:', e);
    }
  }
  
  // 6️⃣ Format: "3/10/2025 17:30" (DD/MM/YYYY HH:MM - Không giây)
  const vnNoSecondRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})$/;
  match = trimmed.match(vnNoSecondRegex);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);
    
    if (isValidDate(day, month, year) && isValidTime(hour, minute, 0)) {
      const start = new Date(year, month, day, hour, minute, 0, 0);
      const end = new Date(year, month, day, hour, minute, 59, 999);
      
      results.push({ start, end, format: 'DD/MM/YYYY HH:MM' });
      console.log(`✅ Parsed DD/MM/YYYY HH:MM: ${day}/${month + 1}/${year} ${hour}:${minute}`);
    }
  }
  
  // 🔹 MỚI 7️⃣ Format: "09:12 3/10/2025" (HH:MM DD/MM/YYYY - Không giây, thời gian trước)
  const timeFirstNoSecRegex = /^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  match = trimmed.match(timeFirstNoSecRegex);
  if (match) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const day = parseInt(match[3]);
    const month = parseInt(match[4]) - 1;
    const year = parseInt(match[5]);
    
    if (isValidDate(day, month, year) && isValidTime(hour, minute, 0)) {
      const start = new Date(year, month, day, hour, minute, 0, 0);
      const end = new Date(year, month, day, hour, minute, 59, 999);
      
      results.push({ start, end, format: 'HH:MM DD/MM/YYYY' });
      console.log(`✅ Parsed HH:MM DD/MM/YYYY: ${hour}:${minute} ${day}/${month + 1}/${year}`);
    }
  }
  
  return results;
}

// 🔹 HÀM PHỤ: Validate date
function isValidDate(day, month, year) {
  if (month < 0 || month > 11) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1970 || year > 2100) return false;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return day <= daysInMonth;
}

// 🔹 HÀM PHỤ: Validate time
function isValidTime(hour, minute, second) {
  return hour >= 0 && hour <= 23 && 
         minute >= 0 && minute <= 59 && 
         second >= 0 && second <= 59;
}