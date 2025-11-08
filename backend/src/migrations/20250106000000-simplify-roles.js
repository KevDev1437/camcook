'use strict';

/**
 * Migration: Simplification des rôles
 * 
 * Cette migration simplifie le système de rôles en 3 rôles uniquement :
 * - superadmin : Super administrateur de la plateforme
 * - adminrestaurant : Administrateur/Owner de restaurant
 * - customer : Client
 * 
 * Anciens rôles → Nouveaux rôles :
 * - admin → superadmin
 * - restaurant → adminrestaurant
 * - customer → customer (inchangé)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Démarrage de la migration de simplification des rôles...');

      // Étape 1 : Modifier les rôles dans la table users
      console.log('📋 Étape 1 : Modification des rôles dans la table users...');
      
      // admin → superadmin
      await queryInterface.sequelize.query(
        `UPDATE users SET role = 'superadmin' WHERE role = 'admin'`,
        { transaction }
      );
      console.log('✅ Rôles admin → superadmin mis à jour');

      // restaurant → adminrestaurant
      await queryInterface.sequelize.query(
        `UPDATE users SET role = 'adminrestaurant' WHERE role = 'restaurant'`,
        { transaction }
      );
      console.log('✅ Rôles restaurant → adminrestaurant mis à jour');

      // customer reste customer (pas de changement)
      console.log('✅ Rôles customer inchangés');

      // Étape 2 : Modifier l'ENUM dans la table users
      console.log('📋 Étape 2 : Modification de l\'ENUM dans la table users...');
      
      // MySQL ne permet pas de modifier directement un ENUM, on utilise ALTER TABLE
      // avec MODIFY COLUMN pour changer l'ENUM
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'adminrestaurant', 'superadmin') NOT NULL DEFAULT 'customer'`,
          { transaction }
        );
        console.log('✅ ENUM modifié avec succès');
      } catch (error) {
        // Si l'erreur indique que l'ENUM est déjà correct, on continue
        if (error.message && error.message.includes('Duplicate column name')) {
          console.log('⚠️  L\'ENUM semble déjà être à jour, vérification...');
        } else {
          throw error;
        }
      }

      await transaction.commit();
      console.log('\n✅ Migration de simplification des rôles terminée avec succès !');
      console.log('\n📋 Résumé des modifications :');
      console.log('   ✓ admin → superadmin');
      console.log('   ✓ restaurant → adminrestaurant');
      console.log('   ✓ customer → customer (inchangé)');
      console.log('   ✓ ENUM mis à jour : (customer, adminrestaurant, superadmin)');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Démarrage du rollback de la migration de simplification des rôles...');

      // Rollback : restaurer les anciens rôles
      console.log('📋 Rollback : Restauration des anciens rôles...');
      
      // superadmin → admin
      await queryInterface.sequelize.query(
        `UPDATE users SET role = 'admin' WHERE role = 'superadmin'`,
        { transaction }
      );
      console.log('✅ Rôles superadmin → admin restaurés');

      // adminrestaurant → restaurant
      await queryInterface.sequelize.query(
        `UPDATE users SET role = 'restaurant' WHERE role = 'adminrestaurant'`,
        { transaction }
      );
      console.log('✅ Rôles adminrestaurant → restaurant restaurés');

      // Restaurer l'ancien ENUM
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'restaurant', 'admin') NOT NULL DEFAULT 'customer'`,
          { transaction }
        );
        console.log('✅ ENUM restauré avec succès');
      } catch (error) {
        console.log('⚠️  Erreur lors de la restauration de l\'ENUM:', error.message);
      }

      await transaction.commit();
      console.log('\n✅ Rollback terminé avec succès !');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors du rollback:', error);
      throw error;
    }
  }
};

