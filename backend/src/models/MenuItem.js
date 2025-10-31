const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'restaurants',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide item name' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide description' }
    }
  },
  category: {
    type: DataTypes.ENUM('Entrées', 'Plats', 'Desserts', 'Boissons', 'Snacks', 'Autres'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide category' }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Price must be positive' },
      notNull: { msg: 'Please provide price' }
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of image URLs'
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Menu item options and customizations'
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preparationTime: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    comment: 'Preparation time in minutes'
  },
  isPopular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allergens: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of allergens'
  },
  calories: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  protein: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  carbs: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  fat: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  }
}, {
  tableName: 'menu_items',
  timestamps: true
});

module.exports = MenuItem;
