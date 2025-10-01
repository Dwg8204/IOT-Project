const dataSensor = require('../models/dataSensor.model');
const paginationHelper = require('../helpers/pagination');
const searchHelper = require('../helpers/search');

module.exports.index = async (req, res) => {
  try {
    const find = {};
    console.log("Query params:", req.query);
    
    // Filter theo sensor type
    const sensorType = req.query.sensorType;
    if (sensorType) {
      find[sensorType] = { $exists: true, $ne: null };
      console.log(`Filtering by sensor type: ${sensorType}`);
    }

    // Search functionality
    const search = searchHelper(req.query);
    const keyword = search.keyword;
    
    if (keyword) {
      // Tìm kiếm trong các trường số của sensor
      const numericKeyword = parseFloat(keyword);
      if (!isNaN(numericKeyword)) {
        find.$or = [
          { temperature: numericKeyword },
          { humidity: numericKeyword },
          { light: numericKeyword },
        ];
      } else {
        find.$or = [
          { temperature: search.regex },
          { humidity: search.regex },
          { light: search.regex },
        ];
      }
    }

    // Pagination setup
    let initPagination = {
      currentPage: 1,
      limitItem: 5
    };
    
    const countRecords = await dataSensor.countDocuments(find);
    const objectPagination = paginationHelper(initPagination, req.query, countRecords);
    
    // Sort setup - luôn sort theo thời gian
    const sort = { createdAt: parseInt(req.query.sortValue) || -1 };
    console.log(`Sorting by createdAt: ${sort.createdAt === 1 ? 'ASC' : 'DESC'}`);
    
    // Fetch data
    const dataSensors = await dataSensor.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip);
    
    // Response với format chuẩn
    res.json({
      data: dataSensors,
      pagination: {
        totalItems: countRecords,
        currentPage: objectPagination.currentPage,
        totalPages: objectPagination.totalPage,
        limitItem: objectPagination.limitItem
      }
    });
    
    console.log(`Found ${dataSensors.length} sensor records`);
    
  } catch (error) {
    console.error("DataSensor controller error:", error);
    res.status(500).json({ 
      message: error.message,
      error: "Internal server error" 
    });
  }
};