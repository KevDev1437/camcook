const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Restaurant = sequelize.define('Restaurant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide restaurant name' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide description' }
    }
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cuisine: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of cuisine types'
  },
  street: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  openingHours: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Opening hours for each day'
  },
  hasPickup: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  hasDelivery: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  minimumOrder: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  estimatedTime: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Estimated preparation time in minutes'
  },
  ratingAverage: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // ============================================
  // CHAMPS MULTI-TENANT / SAAS (ajoutés par migration)
  // ============================================
  slug: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'URL-friendly identifier for the restaurant (e.g., "camcook")'
  },
  subdomain: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'Subdomain for white-label apps (e.g., "camcook" for camcook.yourdomain.com)'
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Custom settings for white-label (colors, fonts, etc.)'
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('free', 'starter', 'pro', 'enterprise'),
    allowNull: true,
    defaultValue: 'free',
    comment: 'Subscription plan for the restaurant'
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'trial', 'cancelled'),
    allowNull: true,
    defaultValue: 'trial',
    comment: 'Current subscription status'
  },
  subscriptionStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when the subscription started'
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when the subscription ends'
  }
}, {
  tableName: 'restaurants',
  timestamps: true
});

module.exports = Restaurant;
