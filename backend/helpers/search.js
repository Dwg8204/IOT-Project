module.exports = (query) => {
    let search = {
        keyword: ""
    }
    if (query.keyword) {
        search.keyword = query.keyword.trim();
        let regex = new RegExp(search.keyword, 'i'); 
        search.regex = regex;
        
        // Thêm xử lý tìm kiếm thời gian
        search.timeSearch = null;
        
        // Phát hiện format "HH:MM:SS DD/MM/YYYY" 
        const timePattern = /^(\d{1,2}):(\d{2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const timeMatch = search.keyword.match(timePattern);
        
        if (timeMatch) {
            const [, hour, minute, second, day, month, year] = timeMatch;
            // Tạo Date object từ format Việt Nam
            const searchDate = new Date(year, month - 1, day, hour, minute, second);
            
            if (!isNaN(searchDate.getTime())) {
                // Tìm trong khoảng 1 giây
                const endDate = new Date(searchDate.getTime() + 1000);
                search.timeSearch = {
                    $gte: searchDate,
                    $lt: endDate
                };
            }
        }
        // Phát hiện format "HH:MM DD/MM/YYYY" (không có giây)
        else {
            const minutePattern = /^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const minuteMatch = search.keyword.match(minutePattern);
            
            if (minuteMatch) {
                const [, hour, minute, day, month, year] = minuteMatch;
                const searchDate = new Date(year, month - 1, day, hour, minute, 0);
                
                if (!isNaN(searchDate.getTime())) {
                    // Tìm trong khoảng 1 phút
                    const endDate = new Date(searchDate.getTime() + 60000);
                    search.timeSearch = {
                        $gte: searchDate,
                        $lt: endDate
                    };
                }
            }
        }
    }
    return search;
}