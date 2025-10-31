const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
  },
  type: {
    type: DataTypes.ENUM('restaurant', 'problem'),
    allowNull: false,
    defaultValue: 'restaurant',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'archived'),
    allowNull: false,
    defaultValue: 'new',
  },
}, {
  tableName: 'contact_messages',
  timestamps: true,
});

module.exports = ContactMessage;
