/**
 * Script pour vérifier si la colonne restaurantId existe dans contact_messages
 * et exécuter la migration si nécessaire
 */

const { sequelize } = require('../src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Vérifier si la colonne restaurantId existe
    const [results] = await sequelize.query(
      "SHOW COLUMNS FROM contact_messages LIKE 'restaurantId'"
    );

    if (results.length === 0) {
      console.log('❌ La colonne restaurantId n\'existe pas dans contact_messages');
      console.log('⚠️  Vous devez exécuter la migration !');
      console.log('\n📋 Pour exécuter la migration :');
      console.log('   cd backend');
      console.log('   npm run migrate');
    } else {
      console.log('✅ La colonne restaurantId existe dans contact_messages');
      console.log('📋 Détails de la colonne :');
      console.log(JSON.stringify(results[0], null, 2));
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();


