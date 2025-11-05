const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Accompaniment = sequelize.define('Accompaniment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Nom de l\'accompagnement',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Prix de l\'accompagnement en euros',
  },
}, {
  tableName: 'accompaniments',
  timestamps: true,
});

module.exports = Accompaniment;




