const dataSensor = require('../models/dataSensor.model');
const paginationHelper = require('../helpers/pagination');
const searchHelper = require('../helpers/search');

module.exports.index = async (req, res) => {
  try {
    const find = {};
    console.log("📋 Query params:", req.query);

    // 🔹 SỬ DỤNG searchHelper để xử lý keyword
    const search = searchHelper(req.query);
    const keyword = search.keyword;
    const searchType = req.query.searchType || 'time';
    
    if (keyword) {
      console.log(`🔍 Searching by ${searchType}: "${keyword}"`);
      
      let isValidSearch = false;

      if (searchType === 'time') {
        // ✅ Tìm kiếm theo THỜI GIAN - Dùng searchHelper
        if (search.timeSearch) {
          console.log('✅ Valid time search from helper:', search.timeSearch);
          
          if (search.timeSearch.$or) {
            find.$or = search.timeSearch.$or.map(timeRange => ({
              createdAt: timeRange
            }));
          } else {
            find.createdAt = search.timeSearch;
          }
          
          isValidSearch = true;
          console.log('📅 Time query:', JSON.stringify(find, null, 2));
        } else {
          console.log('❌ Invalid time format, searchHelper không parse được');
        }
        
      } else if (searchType === 'temperature') {
        // ✅ Tìm kiếm theo NHIỆT ĐỘ
        const numericValue = parseFloat(keyword);
        
        if (!isNaN(numericValue)) {
          find.temperature = numericValue;
          isValidSearch = true;
          console.log(`🌡️ Temperature query: { temperature: ${numericValue} }`);
        } else {
          console.log(`❌ "${keyword}" is not a valid number for temperature`);
        }
        
      } else if (searchType === 'humidity') {
        // ✅ Tìm kiếm theo ĐỘ ẨM
        const numericValue = parseFloat(keyword);
        
        if (!isNaN(numericValue)) {
          find.humidity = numericValue;
          isValidSearch = true;
          console.log(`💧 Humidity query: { humidity: ${numericValue} }`);
        } else {
          console.log(`❌ "${keyword}" is not a valid number for humidity`);
        }
        
      } else if (searchType === 'light') {
        // ✅ Tìm kiếm theo ÁNH SÁNG
        const numericValue = parseFloat(keyword);
        
        if (!isNaN(numericValue)) {
          find.light = numericValue;
          isValidSearch = true;
          console.log(`💡 Light query: { light: ${numericValue} }`);
        } else {
          console.log(`❌ "${keyword}" is not a valid number for light`);
        }
      }

      // 🔹 NẾU SEARCH KHÔNG HỢP LỆ → TRẢ VỀ LỖI
      if (!isValidSearch) {
        console.log('❌ Search validation failed!');
        return res.status(400).json({
          error: 'Invalid search',
          message: `Giá trị tìm kiếm "${keyword}" không hợp lệ cho loại "${searchType}"`,
          hint: searchType === 'time' 
            ? 'Vui lòng nhập thời gian đúng định dạng (VD: 7/10/2025, 09:12:42 3/10/2025, hoặc 2025-10-03)'
            : 'Vui lòng nhập một số hợp lệ'
        });
      }
    }

    console.log('🔎 Final MongoDB query:', JSON.stringify(find, null, 2));

    // Pagination setup
    let initPagination = {
      currentPage: 1,
      limitItem: 5
    };
    
    const countRecords = await dataSensor.countDocuments(find);
    const objectPagination = paginationHelper(initPagination, req.query, countRecords);
    
    // Sort setup
    const sortKey = req.query.sortKey || 'createdAt';
    const sortValue = parseInt(req.query.sortValue) || -1;
    const sort = { [sortKey]: sortValue };
    
    console.log(`📊 Sorting by ${sortKey}: ${sortValue === 1 ? 'ASC ↑' : 'DESC ↓'}`);
    
    // Fetch data
    const dataSensors = await dataSensor.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip);
    
    console.log(`✅ Found ${dataSensors.length}/${countRecords} records`);
    
    // Response
    res.json({
      data: dataSensors,
      pagination: {
        totalItems: countRecords,
        currentPage: objectPagination.currentPage,
        totalPages: objectPagination.totalPage,
        limitItem: objectPagination.limitItem
      }
    });
    
  } catch (error) {
    console.error("❌ Controller error:", error);
    res.status(500).json({ 
      message: error.message,
      error: "Internal server error" 
    });
  }
};