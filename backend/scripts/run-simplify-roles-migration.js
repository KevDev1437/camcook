/**
 * Script pour exécuter la migration de simplification des rôles
 * 
 * Usage:
 *   node scripts/run-simplify-roles-migration.js up    # Exécuter la migration
 *   node scripts/run-simplify-roles-migration.js down   # Rollback la migration
 */

const dotenv = require('dotenv');
const { sequelize } = require('../src/config/database');
const path = require('path');

// Load environment variables
dotenv.config();

async function runMigration() {
  try {
    const command = process.argv[2] || 'up';
    
    if (command !== 'up' && command !== 'down') {
      console.error('❌ Commande invalide. Utilisez "up" ou "down"');
      process.exit(1);
    }

    console.log(`🔄 Connexion à la base de données...`);
    await sequelize.authenticate();
    console.log('✅ Connexion réussie');

    // Charger la migration de simplification des rôles
    const migrationPath = path.join(__dirname, '../src/migrations/20250106000000-simplify-roles.js');
    const migration = require(migrationPath);

    console.log(`📋 Migration trouvée: 20250106000000-simplify-roles.js`);
    console.log(`⬆️  Exécution de la migration (${command})...`);

    const queryInterface = sequelize.getQueryInterface();
    
    if (command === 'up') {
      await migration.up(queryInterface, sequelize);
    } else {
      await migration.down(queryInterface, sequelize);
    }

    console.log(`✅ Migration ${command} exécutée avec succès`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();


