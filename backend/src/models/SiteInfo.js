const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SiteInfo = sequelize.define('SiteInfo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: true },
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'site_info',
  timestamps: true,
});

module.exports = SiteInfo;
