const { sequelize } = require('../src/models');

async function cleanupDuplicateIndexes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie\n');

    // Nettoyer les index en double dans la table users
    console.log('🧹 Nettoyage des index en double dans la table `users`...\n');
    
    const [userIndexes] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND INDEX_NAME LIKE 'email_%'
      GROUP BY INDEX_NAME
      ORDER BY INDEX_NAME
    `);

    let deletedCount = 0;
    for (const idx of userIndexes) {
      try {
        await sequelize.query(`DROP INDEX \`${idx.INDEX_NAME}\` ON \`users\``);
        console.log(`   ✅ Index ${idx.INDEX_NAME} supprimé`);
        deletedCount++;
      } catch (error) {
        if (!error.message.includes("doesn't exist")) {
          console.log(`   ⚠️  Erreur lors de la suppression de ${idx.INDEX_NAME}: ${error.message}`);
        }
      }
    }

    // Nettoyer les index en double dans la table orders
    console.log('\n🧹 Nettoyage des index en double dans la table `orders`...\n');
    
    const [orderIndexes] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND INDEX_NAME LIKE 'orderNumber_%'
      GROUP BY INDEX_NAME
      ORDER BY INDEX_NAME
    `);

    for (const idx of orderIndexes) {
      try {
        await sequelize.query(`DROP INDEX \`${idx.INDEX_NAME}\` ON \`orders\``);
        console.log(`   ✅ Index ${idx.INDEX_NAME} supprimé`);
        deletedCount++;
      } catch (error) {
        if (!error.message.includes("doesn't exist")) {
          console.log(`   ⚠️  Erreur lors de la suppression de ${idx.INDEX_NAME}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ ${deletedCount} index en double supprimés !\n`);

    // Vérifier le résultat
    const [usersCount] = await sequelize.query(`
      SELECT COUNT(DISTINCT INDEX_NAME) as count
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
    `);

    const [ordersCount] = await sequelize.query(`
      SELECT COUNT(DISTINCT INDEX_NAME) as count
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
    `);

    console.log('📊 Résultat après nettoyage :');
    console.log(`   users: ${usersCount[0].count} index`);
    console.log(`   orders: ${ordersCount[0].count} index\n`);

    if (usersCount[0].count <= 64 && ordersCount[0].count <= 64) {
      console.log('✅ Problème résolu ! Les tables sont maintenant sous la limite de 64 index.\n');
    } else {
      console.log('⚠️  Attention : certaines tables sont encore proches de la limite.\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

cleanupDuplicateIndexes();


