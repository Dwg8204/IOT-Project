const dataSensor = require('../models/dataSensor.model');

module.exports.index = async (req, res) => {
  try {
      const find ={
      };
      console.log(req.query);
      if (req.query.status) {
        find.status = req.query.status;
      }
    
    
    
    // const countdataSensor = await dataSensor.countDocuments(find);
    // const objectPagination = paginationHelper(initPagination, req.query, countdataSensor);
    const sort = {
    };
    if (req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = req.query.sortValue;
      }
    const dataSensors = await dataSensor.find(find);
    res.json(dataSensors);
    console.log("dataSensors", dataSensors);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};
