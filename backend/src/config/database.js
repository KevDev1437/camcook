const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'camcook',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully');

    // IMPORTANT : Nettoyer les index en double AVANT la synchronisation (uniquement en développement)
    // En production, les index en double doivent être supprimés via la migration 20250107000000
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      // En développement : nettoyer les index en double avant sync
      // Cela évite l'erreur "Trop de clefs sont définies. Maximum de 64 clefs alloué"
      try {
        const { removeAllDuplicateIndexes } = require('../../scripts/remove-all-duplicate-indexes');
        console.log('🧹 Nettoyage des index en double...');
        await removeAllDuplicateIndexes();
        console.log('✅ Index en double nettoyés');
      } catch (cleanupError) {
        // Si le nettoyage échoue, on continue quand même (peut-être que les index n'existent pas encore)
        // Mais on affiche un avertissement seulement si c'est une vraie erreur (pas juste "index n'existe pas")
        if (cleanupError.message && !cleanupError.message.includes('Unknown key') && !cleanupError.message.includes("doesn't exist")) {
          console.warn('⚠️  Impossible de nettoyer les index en double:', cleanupError.message);
        }
      }
    }

    // Sync all models with database
    // IMPORTANT : En production, on n'utilise PAS alter: true pour éviter la création d'index en double
    // Les modifications de schéma doivent être faites via des migrations
    if (isProduction) {
      // En production : pas de sync automatique, uniquement les migrations
      console.log('✅ Production mode: Database schema managed by migrations only');
    } else {
      // En développement : utiliser alter: true (mais les index en double sont déjà nettoyés)
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
    }
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
