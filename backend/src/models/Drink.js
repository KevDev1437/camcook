const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Drink = sequelize.define('Drink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Nom de la boisson',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Prix de la boisson en euros',
  },
}, {
  tableName: 'drinks',
  timestamps: true,
});

module.exports = Drink;




