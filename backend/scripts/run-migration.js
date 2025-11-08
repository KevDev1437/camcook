/**
 * Script pour exécuter les migrations Sequelize
 * 
 * Usage:
 *   node scripts/run-migration.js up    # Exécuter la migration
 *   node scripts/run-migration.js down   # Rollback la migration
 */

const dotenv = require('dotenv');
const { sequelize } = require('../src/config/database');
const path = require('path');
const fs = require('fs');

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

    // Trouver le fichier de migration le plus récent
    const migrationsDir = path.join(__dirname, '../src/migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error('❌ Dossier migrations introuvable');
      process.exit(1);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort()
      .reverse(); // Plus récent en premier

    if (migrationFiles.length === 0) {
      console.error('❌ Aucune migration trouvée');
      process.exit(1);
    }

    const latestMigration = migrationFiles[0];
    const migrationPath = path.join(migrationsDir, latestMigration);
    
    console.log(`📋 Migration trouvée: ${latestMigration}`);

    // Charger la migration
    const migration = require(migrationPath);
    
    // Exécuter la migration
    if (command === 'up') {
      console.log('⬆️  Exécution de la migration (up)...');
      await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
      console.log('✅ Migration exécutée avec succès');
    } else {
      console.log('⬇️  Exécution du rollback (down)...');
      await migration.down(sequelize.getQueryInterface(), sequelize.constructor);
      console.log('✅ Rollback exécuté avec succès');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Exécuter
runMigration();



