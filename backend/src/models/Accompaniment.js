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
    comment: 'Nom de l\'accompagnement',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Prix de l\'accompagnement en euros',
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
  tableName: 'accompaniments',
  timestamps: true,
  // Index pour performance (créé par migration)
  indexes: [
    { fields: ['restaurantId'] },
    // Index composite unique pour éviter les doublons de nom par restaurant
    { 
      fields: ['name', 'restaurantId'], 
      unique: true, 
      name: 'unique_accompaniment_per_restaurant' 
    }
  ]
});

module.exports = Accompaniment;
