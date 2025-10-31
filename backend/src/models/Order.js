const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'restaurants',
      key: 'id'
    }
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of order items with details'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  orderType: {
    type: DataTypes.ENUM('pickup', 'delivery'),
    allowNull: false
  },
  deliveryStreet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  deliveryCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  deliveryPostalCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  deliveryLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  deliveryLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  deliveryInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'on_delivery', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'mobile_money'),
    allowNull: false
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedReadyTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ratingScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  ratingComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  hooks: {
    beforeCreate: async (order) => {
      if (!order.orderNumber) {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        order.orderNumber = `CC${timestamp}-${randomNum}`;
      }
    }
  }
});

module.exports = Order;
