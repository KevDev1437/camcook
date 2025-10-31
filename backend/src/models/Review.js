const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  menuItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
      isInt: true
    },
    comment: 'Rating from 1 to 5 stars'
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Review text cannot be empty' },
      len: {
        args: [10, 500],
        msg: 'Review must be between 10 and 500 characters'
      }
    }
  },
  isVerifiedPurchase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether user actually purchased this item'
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of people who found this review helpful'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: 'Moderation status'
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    { fields: ['menuItemId'] },
    { fields: ['userId'] },
    { fields: ['menuItemId', 'userId'], unique: true, name: 'unique_user_review_per_item' }
  ]
});

module.exports = Review;
