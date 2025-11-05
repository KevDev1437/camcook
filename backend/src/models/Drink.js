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
    comment: 'Nom de la boisson',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Prix de la boisson en euros',
  },
  // ============================================
  // CHAMP MULTI-TENANT (ajouté par migration)
  // ============================================
  restaurantId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Permettre null pour compatibilité avec données existantes
    references: {
      model: 'restaurants',
      key: 'id'
    },
    comment: 'ID du restaurant propriétaire (multi-tenant)'
  },
}, {
  tableName: 'drinks',
  timestamps: true,
  // Index pour performance (créé par migration)
  indexes: [
    { fields: ['restaurantId'] },
    // Index composite unique pour éviter les doublons de nom par restaurant
    { 
      fields: ['name', 'restaurantId'], 
      unique: true, 
      name: 'unique_drink_per_restaurant' 
    }
  ]
});

module.exports = Drink;
