'use strict';

/**
 * Migration: Ajout du support multi-tenant (SaaS White Label)
 * 
 * Cette migration transforme l'application CamCook en SaaS multi-restaurants :
 * - Ajoute restaurantId aux modèles Accompaniment, Drink, ContactMessage
 * - Ajoute de nouveaux champs au modèle Restaurant pour le SaaS
 * - Migre les données existantes vers le restaurant CamCook
 * - Crée les index nécessaires pour la performance
 * 
 * IMPORTANT : 
 * - Tester cette migration sur une copie de la base de données d'abord
 * - Sauvegarder la base de données avant d'exécuter cette migration
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Démarrage de la migration multi-tenant...');

      // ==========================================
      // ÉTAPE 1 : Identifier le restaurant CamCook
      // ==========================================
      console.log('📋 Étape 1 : Identification du restaurant CamCook...');
      
      const [restaurants] = await queryInterface.sequelize.query(
        `SELECT id, name FROM restaurants WHERE name = 'CamCook' LIMIT 1`,
        { transaction }
      );

      if (restaurants.length === 0) {
        throw new Error('❌ Restaurant CamCook introuvable. Veuillez créer le restaurant CamCook avant d\'exécuter cette migration.');
      }

      const camcookRestaurantId = restaurants[0].id;
      console.log(`✅ Restaurant CamCook trouvé (ID: ${camcookRestaurantId})`);

      // ==========================================
      // ÉTAPE 2 : Ajouter les champs au modèle Restaurant
      // ==========================================
      console.log('📋 Étape 2 : Ajout des champs SaaS au modèle Restaurant...');

      // Vérifier si les colonnes existent déjà
      const [restaurantColumns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM restaurants LIKE 'slug'`,
        { transaction }
      );

      if (restaurantColumns.length === 0) {
        // Ajouter slug
        await queryInterface.addColumn('restaurants', 'slug', {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment: 'Slug unique pour les URLs (ex: "burger-house")',
        }, { transaction });

        // Ajouter subdomain
        await queryInterface.addColumn('restaurants', 'subdomain', {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
          comment: 'Sous-domaine personnalisé (ex: "burgerhouse")',
        }, { transaction });

        // Ajouter settings (JSON)
        await queryInterface.addColumn('restaurants', 'settings', {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Configuration personnalisée : couleurs, fonts, logos, etc.',
        }, { transaction });

        // Ajouter subscriptionPlan
        await queryInterface.addColumn('restaurants', 'subscriptionPlan', {
          type: Sequelize.ENUM('free', 'starter', 'pro', 'enterprise'),
          allowNull: false,
          defaultValue: 'free',
          comment: 'Plan d\'abonnement SaaS',
        }, { transaction });

        // Ajouter subscriptionStatus
        await queryInterface.addColumn('restaurants', 'subscriptionStatus', {
          type: Sequelize.ENUM('active', 'inactive', 'trial', 'cancelled'),
          allowNull: false,
          defaultValue: 'trial',
          comment: 'Statut de l\'abonnement SaaS',
        }, { transaction });

        // Ajouter subscriptionStartDate
        await queryInterface.addColumn('restaurants', 'subscriptionStartDate', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Date de début de l\'abonnement',
        }, { transaction });

        // Ajouter subscriptionEndDate
        await queryInterface.addColumn('restaurants', 'subscriptionEndDate', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Date de fin de l\'abonnement',
        }, { transaction });

        console.log('✅ Champs SaaS ajoutés au modèle Restaurant');
      } else {
        console.log('⚠️  Les champs SaaS existent déjà dans Restaurant, passage à l\'étape suivante...');
      }

      // Générer et assigner le slug pour CamCook s'il n'existe pas
      const [camcookData] = await queryInterface.sequelize.query(
        `SELECT slug FROM restaurants WHERE id = ${camcookRestaurantId}`,
        { transaction }
      );

      if (!camcookData[0].slug) {
        const camcookSlug = 'camcook';
        await queryInterface.sequelize.query(
          `UPDATE restaurants SET slug = '${camcookSlug}' WHERE id = ${camcookRestaurantId}`,
          { transaction }
        );
        console.log(`✅ Slug 'camcook' assigné au restaurant CamCook`);
      }

      // ==========================================
      // ÉTAPE 3 : Ajouter restaurantId à Accompaniment
      // ==========================================
      console.log('📋 Étape 3 : Ajout de restaurantId à Accompaniment...');

      const [accompanimentColumns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM accompaniments LIKE 'restaurantId'`,
        { transaction }
      );

      if (accompanimentColumns.length === 0) {
        // Ajouter la colonne restaurantId
        await queryInterface.addColumn('accompaniments', 'restaurantId', {
          type: Sequelize.INTEGER,
          allowNull: true, // Temporairement nullable pour permettre la migration
          references: {
            model: 'restaurants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID du restaurant propriétaire',
        }, { transaction });

        // Migrer les données existantes vers CamCook
        await queryInterface.sequelize.query(
          `UPDATE accompaniments SET restaurantId = ${camcookRestaurantId} WHERE restaurantId IS NULL`,
          { transaction }
        );
        console.log(`✅ Données Accompaniment migrées vers restaurant ID ${camcookRestaurantId}`);

        // Rendre la colonne NOT NULL maintenant que toutes les données sont migrées
        await queryInterface.changeColumn('accompaniments', 'restaurantId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'restaurants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID du restaurant propriétaire',
        }, { transaction });

        // Créer l'index pour la performance
        await queryInterface.addIndex('accompaniments', ['restaurantId'], {
          name: 'idx_accompaniments_restaurantId',
          transaction
        });
        console.log('✅ Index créé sur accompaniments.restaurantId');
      } else {
        console.log('⚠️  La colonne restaurantId existe déjà dans Accompaniment');
      }

      // Supprimer la contrainte unique sur name si elle existe (car name doit être unique par restaurant)
      try {
        await queryInterface.removeIndex('accompaniments', 'accompaniments_name_unique', { transaction });
        console.log('✅ Contrainte unique sur name supprimée (sera remplacée par unique composite)');
      } catch (e) {
        // L'index peut ne pas exister, c'est OK
        console.log('ℹ️  Contrainte unique sur name déjà absente ou nom différent');
      }

      // Créer un index unique composite (restaurantId, name)
      try {
        await queryInterface.addIndex('accompaniments', ['restaurantId', 'name'], {
          unique: true,
          name: 'idx_accompaniments_restaurantId_name_unique',
          transaction
        });
        console.log('✅ Index unique composite créé sur (accompaniments.restaurantId, name)');
      } catch (e) {
        console.log('⚠️  Index unique composite peut déjà exister');
      }

      // ==========================================
      // ÉTAPE 4 : Ajouter restaurantId à Drink
      // ==========================================
      console.log('📋 Étape 4 : Ajout de restaurantId à Drink...');

      const [drinkColumns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM drinks LIKE 'restaurantId'`,
        { transaction }
      );

      if (drinkColumns.length === 0) {
        // Ajouter la colonne restaurantId
        await queryInterface.addColumn('drinks', 'restaurantId', {
          type: Sequelize.INTEGER,
          allowNull: true, // Temporairement nullable pour permettre la migration
          references: {
            model: 'restaurants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID du restaurant propriétaire',
        }, { transaction });

        // Migrer les données existantes vers CamCook
        await queryInterface.sequelize.query(
          `UPDATE drinks SET restaurantId = ${camcookRestaurantId} WHERE restaurantId IS NULL`,
          { transaction }
        );
        console.log(`✅ Données Drink migrées vers restaurant ID ${camcookRestaurantId}`);

        // Rendre la colonne NOT NULL maintenant que toutes les données sont migrées
        await queryInterface.changeColumn('drinks', 'restaurantId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'restaurants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID du restaurant propriétaire',
        }, { transaction });

        // Créer l'index pour la performance
        await queryInterface.addIndex('drinks', ['restaurantId'], {
          name: 'idx_drinks_restaurantId',
          transaction
        });
        console.log('✅ Index créé sur drinks.restaurantId');
      } else {
        console.log('⚠️  La colonne restaurantId existe déjà dans Drink');
      }

      // Supprimer la contrainte unique sur name si elle existe
      try {
        await queryInterface.removeIndex('drinks', 'drinks_name_unique', { transaction });
        console.log('✅ Contrainte unique sur name supprimée (sera remplacée par unique composite)');
      } catch (e) {
        console.log('ℹ️  Contrainte unique sur name déjà absente ou nom différent');
      }

      // Créer un index unique composite (restaurantId, name)
      try {
        await queryInterface.addIndex('drinks', ['restaurantId', 'name'], {
          unique: true,
          name: 'idx_drinks_restaurantId_name_unique',
          transaction
        });
        console.log('✅ Index unique composite créé sur (drinks.restaurantId, name)');
      } catch (e) {
        console.log('⚠️  Index unique composite peut déjà exister');
      }

      // ==========================================
      // ÉTAPE 5 : Ajouter restaurantId à ContactMessage
      // ==========================================
      console.log('📋 Étape 5 : Ajout de restaurantId à ContactMessage...');

      const [contactMessageColumns] = await queryInterface.sequelize.query(
        `SHOW COLUMNS FROM contact_messages LIKE 'restaurantId'`,
        { transaction }
      );

      if (contactMessageColumns.length === 0) {
        // Ajouter la colonne restaurantId
        await queryInterface.addColumn('contact_messages', 'restaurantId', {
          type: Sequelize.INTEGER,
          allowNull: true, // Temporairement nullable pour permettre la migration
          references: {
            model: 'restaurants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID du restaurant concerné par le message',
        }, { transaction });

        // Migrer les données existantes vers CamCook
        await queryInterface.sequelize.query(
          `UPDATE contact_messages SET restaurantId = ${camcookRestaurantId} WHERE restaurantId IS NULL`,
          { transaction }
        );
        console.log(`✅ Données ContactMessage migrées vers restaurant ID ${camcookRestaurantId}`);

        // Rendre la colonne NOT NULL maintenant que toutes les données sont migrées
        await queryInterface.changeColumn('contact_messages', 'restaurantId', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'restaurants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'ID du restaurant concerné par le message',
        }, { transaction });

        // Créer l'index pour la performance
        await queryInterface.addIndex('contact_messages', ['restaurantId'], {
          name: 'idx_contact_messages_restaurantId',
          transaction
        });
        console.log('✅ Index créé sur contact_messages.restaurantId');
      } else {
        console.log('⚠️  La colonne restaurantId existe déjà dans ContactMessage');
      }

      // ==========================================
      // ÉTAPE 6 : Créer les index sur Restaurant
      // ==========================================
      console.log('📋 Étape 6 : Création des index sur Restaurant...');

      // Index sur slug
      try {
        await queryInterface.addIndex('restaurants', ['slug'], {
          unique: true,
          name: 'idx_restaurants_slug',
          transaction
        });
        console.log('✅ Index unique créé sur restaurants.slug');
      } catch (e) {
        console.log('⚠️  Index sur slug peut déjà exister');
      }

      // Index sur subdomain
      try {
        await queryInterface.addIndex('restaurants', ['subdomain'], {
          unique: true,
          name: 'idx_restaurants_subdomain',
          transaction
        });
        console.log('✅ Index unique créé sur restaurants.subdomain');
      } catch (e) {
        console.log('⚠️  Index sur subdomain peut déjà exister');
      }

      // ==========================================
      // VALIDATION FINALE
      // ==========================================
      console.log('\n✅ Migration multi-tenant terminée avec succès !');
      console.log('\n📋 Résumé des modifications :');
      console.log('   ✓ Champs SaaS ajoutés à Restaurant');
      console.log('   ✓ restaurantId ajouté à Accompaniment');
      console.log('   ✓ restaurantId ajouté à Drink');
      console.log('   ✓ restaurantId ajouté à ContactMessage');
      console.log('   ✓ Index de performance créés');
      console.log('   ✓ Données existantes migrées vers CamCook (ID: ' + camcookRestaurantId + ')');
      
      await transaction.commit();
      console.log('\n✅ Transaction commitée avec succès');
    } catch (error) {
      await transaction.rollback();
      console.error('\n❌ Erreur lors de la migration, rollback effectué:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Démarrage du rollback de la migration multi-tenant...');

      // ==========================================
      // ROLLBACK : Supprimer les index sur Restaurant
      // ==========================================
      console.log('📋 Suppression des index sur Restaurant...');
      
      try {
        await queryInterface.removeIndex('restaurants', 'idx_restaurants_slug', { transaction });
        console.log('✅ Index restaurants.slug supprimé');
      } catch (e) {
        console.log('⚠️  Index restaurants.slug n\'existe pas ou déjà supprimé');
      }

      try {
        await queryInterface.removeIndex('restaurants', 'idx_restaurants_subdomain', { transaction });
        console.log('✅ Index restaurants.subdomain supprimé');
      } catch (e) {
        console.log('⚠️  Index restaurants.subdomain n\'existe pas ou déjà supprimé');
      }

      // ==========================================
      // ROLLBACK : Supprimer restaurantId de ContactMessage
      // ==========================================
      console.log('📋 Suppression de restaurantId de ContactMessage...');
      
      try {
        await queryInterface.removeIndex('contact_messages', 'idx_contact_messages_restaurantId', { transaction });
        await queryInterface.removeColumn('contact_messages', 'restaurantId', { transaction });
        console.log('✅ restaurantId supprimé de ContactMessage');
      } catch (e) {
        console.log('⚠️  restaurantId n\'existe pas dans ContactMessage ou déjà supprimé');
      }

      // ==========================================
      // ROLLBACK : Supprimer restaurantId de Drink
      // ==========================================
      console.log('📋 Suppression de restaurantId de Drink...');
      
      try {
        await queryInterface.removeIndex('drinks', 'idx_drinks_restaurantId_name_unique', { transaction });
        await queryInterface.removeIndex('drinks', 'idx_drinks_restaurantId', { transaction });
        await queryInterface.removeColumn('drinks', 'restaurantId', { transaction });
        console.log('✅ restaurantId supprimé de Drink');
      } catch (e) {
        console.log('⚠️  restaurantId n\'existe pas dans Drink ou déjà supprimé');
      }

      // ==========================================
      // ROLLBACK : Supprimer restaurantId de Accompaniment
      // ==========================================
      console.log('📋 Suppression de restaurantId de Accompaniment...');
      
      try {
        await queryInterface.removeIndex('accompaniments', 'idx_accompaniments_restaurantId_name_unique', { transaction });
        await queryInterface.removeIndex('accompaniments', 'idx_accompaniments_restaurantId', { transaction });
        await queryInterface.removeColumn('accompaniments', 'restaurantId', { transaction });
        console.log('✅ restaurantId supprimé de Accompaniment');
      } catch (e) {
        console.log('⚠️  restaurantId n\'existe pas dans Accompaniment ou déjà supprimé');
      }

      // ==========================================
      // ROLLBACK : Supprimer les champs SaaS de Restaurant
      // ==========================================
      console.log('📋 Suppression des champs SaaS de Restaurant...');
      
      const columnsToRemove = [
        'subscriptionEndDate',
        'subscriptionStartDate',
        'subscriptionStatus',
        'subscriptionPlan',
        'settings',
        'subdomain',
        'slug'
      ];

      for (const column of columnsToRemove) {
        try {
          await queryInterface.removeColumn('restaurants', column, { transaction });
          console.log(`✅ Colonne ${column} supprimée de Restaurant`);
        } catch (e) {
          console.log(`⚠️  Colonne ${column} n'existe pas dans Restaurant ou déjà supprimée`);
        }
      }

      await transaction.commit();
      console.log('\n✅ Rollback terminé avec succès');
    } catch (error) {
      await transaction.rollback();
      console.error('\n❌ Erreur lors du rollback, rollback effectué:', error);
      throw error;
    }
  }
};

