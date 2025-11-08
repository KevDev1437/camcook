const { sequelize } = require('../src/models');

async function checkIndexes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie\n');

    // Récupérer toutes les tables
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    console.log('📊 Vérification des index par table :\n');
    console.log('='.repeat(60));

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      // Compter les index pour cette table
      const [indexes] = await sequelize.query(`
        SELECT 
          INDEX_NAME,
          GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
          NON_UNIQUE,
          INDEX_TYPE
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        GROUP BY INDEX_NAME, NON_UNIQUE, INDEX_TYPE
        ORDER BY INDEX_NAME
      `, {
        replacements: [tableName]
      });

      const indexCount = indexes.length;
      const status = indexCount > 64 ? '❌' : indexCount > 50 ? '⚠️' : '✅';
      
      console.log(`\n${status} ${tableName}: ${indexCount} index${indexCount > 1 ? 'es' : ''}`);
      
      if (indexCount > 64) {
        console.log(`   ⚠️  DÉPASSEMENT ! Maximum de 64 index autorisé`);
      } else if (indexCount > 50) {
        console.log(`   ⚠️  Attention : proche de la limite (64)`);
      }

      if (indexCount > 20) {
        console.log(`   📋 Détail des index :`);
        indexes.forEach(idx => {
          const unique = idx.NON_UNIQUE === 0 ? 'UNIQUE' : '';
          console.log(`      - ${idx.INDEX_NAME} (${idx.columns}) ${unique} [${idx.INDEX_TYPE}]`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Vérification terminée !\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('Trop de clefs')) {
      console.error('\n⚠️  Une table dépasse la limite de 64 index/clés MySQL.');
      console.error('   Vérifiez les tables avec beaucoup d\'index dans les modèles Sequelize.');
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkIndexes();


