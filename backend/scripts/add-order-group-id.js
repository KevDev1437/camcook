require('dotenv').config();
const { sequelize } = require('../src/config/database');

const addOrderGroupId = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // Vérifier si la colonne existe
    const [results] = await sequelize.query('DESCRIBE orders;');
    const column = results.find(r => r.Field === 'orderGroupId');
    
    if (column) {
      console.log('✅ La colonne orderGroupId existe déjà');
      console.log('   Type:', column.Type);
      console.log('   Null:', column.Null);
    } else {
      console.log('❌ La colonne orderGroupId n\'existe pas');
      console.log('🔄 Ajout de la colonne orderGroupId...');
      
      await sequelize.query('ALTER TABLE orders ADD COLUMN orderGroupId VARCHAR(50) NULL AFTER orderNumber;');
      console.log('✅ Colonne orderGroupId ajoutée avec succès');
    }

    // Vérifier à nouveau
    const [results2] = await sequelize.query('DESCRIBE orders;');
    const column2 = results2.find(r => r.Field === 'orderGroupId');
    if (column2) {
      console.log('\n✅ Vérification finale: La colonne orderGroupId existe');
    }

    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column') || error.message.includes('déjà utilisé')) {
      console.log('✅ La colonne orderGroupId existe déjà (message d\'erreur MySQL)');
      process.exit(0);
    } else {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    }
  }
};

addOrderGroupId();




