/**
 * Migration : Ajouter defaultRestaurantId aux utilisateurs
 * 
 * Cette migration ajoute un champ defaultRestaurantId dans la table users
 * pour isoler les clients par restaurant dans un contexte White Label.
 * 
 * Un client qui s'inscrit dans l'app CamCook ne pourra se connecter que dans l'app CamCook.
 * Un client qui s'inscrit dans l'app Burger House ne pourra se connecter que dans l'app Burger House.
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter la colonne defaultRestaurantId
    await queryInterface.addColumn('users', 'defaultRestaurantId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Restaurant par défaut pour les clients (White Label isolation)',
      references: {
        model: 'restaurants',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Créer un index pour améliorer les performances
    await queryInterface.addIndex('users', ['defaultRestaurantId'], {
      name: 'users_default_restaurant_id_idx'
    });

    console.log('✅ Colonne defaultRestaurantId ajoutée à la table users');
  },

  async down(queryInterface, Sequelize) {
    // Supprimer l'index
    await queryInterface.removeIndex('users', 'users_default_restaurant_id_idx');

    // Supprimer la colonne
    await queryInterface.removeColumn('users', 'defaultRestaurantId');

    console.log('✅ Colonne defaultRestaurantId supprimée de la table users');
  }
};


