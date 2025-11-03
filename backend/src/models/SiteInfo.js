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
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
      comment: 'Global settings including default accompaniments and drinks (format: {name, price})',
      defaultValue: () => ({
        accompaniments: [
          { name: 'Plantain Frit', price: 0 },
          { name: 'Baton de manioc', price: 0 },
          { name: 'Wete Fufu', price: 0 },
          { name: 'Frite de pomme', price: 0 }
        ],
        drinks: [{ name: 'Bissap', price: 0 }],
      }),
  },
}, {
  tableName: 'site_info',
  timestamps: true,
});

module.exports = SiteInfo;
