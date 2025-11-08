/**
 * Migration : Suppression permanente des index en double
 * 
 * Cette migration supprime définitivement tous les index en double qui causent
 * l'erreur "Trop de clefs sont définies. Maximum de 64 clefs alloué"
 * 
 * IMPORTANT : Cette migration doit être exécutée une seule fois et ne doit jamais
 * être rollbackée en production.
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🧹 Suppression permanente des index en double...\n');

      let totalDropped = 0;
      const dbName = queryInterface.sequelize.config.database;

      // ============================================
      // TABLE: restaurants - Supprimer slug_2 à slug_30
      // ============================================
      console.log('🗑️  Suppression des index UNIQUE en double sur restaurants.slug...');
      
      for (let i = 2; i <= 30; i++) {
        const indexName = `slug_${i}`;
        try {
          await queryInterface.sequelize.query(
            `DROP INDEX \`${indexName}\` ON \`restaurants\``,
            { transaction }
          );
          console.log(`  ✅ ${indexName} supprimé`);
          totalDropped++;
        } catch (error) {
          // Ignorer si l'index n'existe pas
          if (!error.message.includes('Unknown key') && !error.message.includes("doesn't exist")) {
            console.warn(`  ⚠️  ${indexName}: ${error.message}`);
          }
        }
      }

      // ============================================
      // TABLE: restaurants - Supprimer subdomain_2 à subdomain_30
      // ============================================
      console.log('\n🗑️  Suppression des index UNIQUE en double sur restaurants.subdomain...');
      
      for (let i = 2; i <= 30; i++) {
        const indexName = `subdomain_${i}`;
        try {
          await queryInterface.sequelize.query(
            `DROP INDEX \`${indexName}\` ON \`restaurants\``,
            { transaction }
          );
          console.log(`  ✅ ${indexName} supprimé`);
          totalDropped++;
        } catch (error) {
          // Ignorer si l'index n'existe pas
          if (!error.message.includes('Unknown key') && !error.message.includes("doesn't exist")) {
            console.warn(`  ⚠️  ${indexName}: ${error.message}`);
          }
        }
      }

      // ============================================
      // TABLE: accompaniments - Supprimer name_2 à name_32
      // ============================================
      console.log('\n🗑️  Suppression des index UNIQUE en double sur accompaniments.name...');
      
      for (let i = 2; i <= 32; i++) {
        const indexName = `name_${i}`;
        try {
          await queryInterface.sequelize.query(
            `DROP INDEX \`${indexName}\` ON \`accompaniments\``,
            { transaction }
          );
          console.log(`  ✅ ${indexName} supprimé`);
          totalDropped++;
        } catch (error) {
          // Ignorer si l'index n'existe pas
          if (!error.message.includes('Unknown key') && !error.message.includes("doesn't exist")) {
            console.warn(`  ⚠️  ${indexName}: ${error.message}`);
          }
        }
      }

      // ============================================
      // TABLE: drinks - Supprimer name_2 à name_32
      // ============================================
      console.log('\n🗑️  Suppression des index UNIQUE en double sur drinks.name...');
      
      for (let i = 2; i <= 32; i++) {
        const indexName = `name_${i}`;
        try {
          await queryInterface.sequelize.query(
            `DROP INDEX \`${indexName}\` ON \`drinks\``,
            { transaction }
          );
          console.log(`  ✅ ${indexName} supprimé`);
          totalDropped++;
        } catch (error) {
          // Ignorer si l'index n'existe pas
          if (!error.message.includes('Unknown key') && !error.message.includes("doesn't exist")) {
            console.warn(`  ⚠️  ${indexName}: ${error.message}`);
          }
        }
      }

      // ============================================
      // VÉRIFICATION FINALE
      // ============================================
      console.log('\n📊 Vérification finale...\n');

      const finalStats = await queryInterface.sequelize.query(`
        SELECT 
          TABLE_NAME, 
          COUNT(*) as index_count
        FROM 
          information_schema.STATISTICS 
        WHERE 
          TABLE_SCHEMA = :dbName
          AND TABLE_NAME IN ('restaurants', 'accompaniments', 'drinks')
        GROUP BY 
          TABLE_NAME 
        ORDER BY 
          index_count DESC
      `, {
        replacements: { dbName },
        type: Sequelize.QueryTypes.SELECT,
        transaction
      });

      console.log('Index par table (APRÈS nettoyage) :');
      console.log('=====================================');
      finalStats.forEach(stat => {
        const status = stat.index_count > 20 ? '⚠️' : '✅';
        console.log(`  ${status} ${stat.TABLE_NAME}: ${stat.index_count} index`);
      });
      console.log('');

      await transaction.commit();
      
      console.log(`\n✅ Migration terminée : ${totalDropped} index en double supprimés\n`);
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // IMPORTANT : Ne pas rollbacker cette migration en production
    // Les index en double ne doivent pas être recréés
    console.log('⚠️  Rollback désactivé pour cette migration (sécurité)');
    console.log('⚠️  Les index en double ne doivent pas être recréés');
    return Promise.resolve();
  }
};




