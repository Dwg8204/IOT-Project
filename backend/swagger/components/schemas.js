module.exports = {
  // ==================== DATA SENSOR SCHEMAS ====================
  
  DataSensor: {
    type: 'object',
    required: ['temperature', 'humidity', 'light'],
    properties: {
      _id: {
        type: 'string',
        example: '671a2b3c4d5e6f7890123456',
        description: 'MongoDB ObjectId'
      },
      temperature: {
        type: 'number',
        format: 'float',
        minimum: -50,
        maximum: 100,
        example: 28.5,
        description: 'Nhiệt độ (°C)'
      },
      humidity: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 68.0,
        description: 'Độ ẩm (%)'
      },
      light: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 320,
        description: 'Cường độ ánh sáng (Lux)'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-10-07T10:15:30.456Z',
        description: 'Thời gian ghi nhận dữ liệu'
      }
    }
  },

  DataSensorList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/DataSensor'
        }
      },
      pagination: {
        $ref: '#/components/schemas/Pagination'
      }
    }
  },

  // ==================== ACTION HISTORY SCHEMAS ====================
  
  ActionHistory: {
    type: 'object',
    required: ['device', 'action'],
    properties: {
      _id: {
        type: 'string',
        example: '671a2b3c4d5e6f7890abcdef'
      },
      device: {
        type: 'string',
        enum: ['fan', 'air', 'light'],
        example: 'light',
        description: 'Tên thiết bị (fan=Quạt, air=Điều hòa, light=Đèn)'
      },
      action: {
        type: 'string',
        enum: ['on', 'off'],
        example: 'on',
        description: 'Hành động (on=Bật, off=Tắt)'
      },
      status: {
        type: 'string',
        example: 'ok',
        description: 'Trạng thái thực thi (ok, error, pending, timeout)'
      },
      message: {
        type: 'string',
        example: 'Light turned on successfully',
        description: 'Thông báo chi tiết kết quả'
      },
      createAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-10-07T10:16:25.789Z',
        description: 'Thời gian thực hiện hành động'
      }
    }
  },

  ActionHistoryList: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ActionHistory'
        }
      },
      pagination: {
        $ref: '#/components/schemas/Pagination'
      }
    }
  },

  CreateActionRequest: {
    type: 'object',
    required: ['device', 'action'],
    properties: {
      device: {
        type: 'string',
        enum: ['fan', 'air', 'light'],
        example: 'light',
        description: 'Thiết bị cần điều khiển'
      },
      action: {
        type: 'string',
        enum: ['on', 'off'],
        example: 'on',
        description: 'Hành động thực hiện'
      }
    }
  },

  // ==================== HOME/DASHBOARD SCHEMAS ====================
  
  DashboardStats: {
    type: 'object',
    properties: {
      latestSensor: {
        $ref: '#/components/schemas/DataSensor',
        description: 'Dữ liệu cảm biến mới nhất'
      },
      deviceStatus: {
        type: 'object',
        properties: {
          fan: {
            type: 'string',
            enum: ['on', 'off'],
            example: 'on'
          },
          air: {
            type: 'string',
            enum: ['on', 'off'],
            example: 'off'
          },
          light: {
            type: 'string',
            enum: ['on', 'off'],
            example: 'on'
          }
        },
        description: 'Trạng thái hiện tại của các thiết bị'
      },
      stats: {
        type: 'object',
        properties: {
          totalSensorRecords: {
            type: 'integer',
            example: 1542,
            description: 'Tổng số bản ghi cảm biến'
          },
          totalActions: {
            type: 'integer',
            example: 234,
            description: 'Tổng số lần điều khiển'
          },
          avgTemperature: {
            type: 'number',
            example: 27.8,
            description: 'Nhiệt độ trung bình'
          },
          avgHumidity: {
            type: 'number',
            example: 65.2,
            description: 'Độ ẩm trung bình'
          }
        }
      }
    }
  },

  DeviceStatus: {
    type: 'object',
    properties: {
      fan: {
        type: 'string',
        enum: ['on', 'off'],
        example: 'on'
      },
      air: {
        type: 'string',
        enum: ['on', 'off'],
        example: 'off'
      },
      light: {
        type: 'string',
        enum: ['on', 'off'],
        example: 'on'
      }
    }
  },

  // ==================== COMMON SCHEMAS ====================
  
  Pagination: {
    type: 'object',
    properties: {
      totalItems: {
        type: 'integer',
        example: 150,
        description: 'Tổng số bản ghi trong database'
      },
      currentPage: {
        type: 'integer',
        example: 1,
        description: 'Trang hiện tại'
      },
      totalPages: {
        type: 'integer',
        example: 30,
        description: 'Tổng số trang'
      },
      limitItem: {
        type: 'integer',
        example: 5,
        description: 'Số bản ghi mỗi trang'
      }
    }
  },

  Error: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        example: 'Invalid search',
        description: 'Loại lỗi'
      },
      message: {
        type: 'string',
        example: 'Giá trị tìm kiếm không hợp lệ',
        description: 'Thông báo lỗi chi tiết'
      },
      hint: {
        type: 'string',
        example: 'Vui lòng nhập một số hợp lệ',
        description: 'Gợi ý khắc phục'
      }
    }
  },

  SuccessMessage: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Operation completed successfully'
      },
      data: {
        type: 'object'
      }
    }
  }
};