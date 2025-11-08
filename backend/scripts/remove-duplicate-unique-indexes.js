/**
 * Script pour supprimer les index UNIQUE en double
 * 
 * Supprime tous les index email_2 à email_63 sur users
 * Supprime tous les index orderNumber_2 à orderNumber_59 sur orders
 * 
 * Garde uniquement : email et orderNumber
 * 
 * Usage: node backend/scripts/remove-duplicate-unique-indexes.js
 */

const { sequelize } = require('../src/config/database');

async function removeDuplicateIndexes() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        // ============================================
        // TABLE: users - Supprimer email_2 à email_63
        // ============================================
        console.log('🗑️  Suppression des index UNIQUE en double sur users.email...\n');
        
        let droppedCount = 0;
        let errorCount = 0;

        // Supprimer email_2 à email_63
        for (let i = 2; i <= 63; i++) {
            const indexName = `email_${i}`;
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON \`users\``);
                console.log(`  ✅ ${indexName} supprimé`);
                droppedCount++;
            } catch (error) {
                if (error.message.includes("Unknown key") || error.message.includes("doesn't exist")) {
                    // L'index n'existe pas, c'est OK
                } else {
                    console.error(`  ❌ Erreur lors de la suppression de ${indexName}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`\n✅ ${droppedCount} index supprimés sur users`);
        if (errorCount > 0) {
            console.log(`⚠️  ${errorCount} erreurs`);
        }

        // ============================================
        // TABLE: orders - Supprimer orderNumber_2 à orderNumber_59
        // ============================================
        console.log('\n🗑️  Suppression des index UNIQUE en double sur orders.orderNumber...\n');
        
        droppedCount = 0;
        errorCount = 0;

        // Supprimer orderNumber_2 à orderNumber_59
        for (let i = 2; i <= 59; i++) {
            const indexName = `orderNumber_${i}`;
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON \`orders\``);
                console.log(`  ✅ ${indexName} supprimé`);
                droppedCount++;
            } catch (error) {
                if (error.message.includes("Unknown key") || error.message.includes("doesn't exist")) {
                    // L'index n'existe pas, c'est OK
                } else {
                    console.error(`  ❌ Erreur lors de la suppression de ${indexName}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`\n✅ ${droppedCount} index supprimés sur orders`);
        if (errorCount > 0) {
            console.log(`⚠️  ${errorCount} erreurs`);
        }

        // ============================================
        // VÉRIFICATION FINALE
        // ============================================
        console.log('\n📊 Vérification finale...\n');

        const dbName = sequelize.config.database;
        const finalStats = await sequelize.query(`
            SELECT 
                TABLE_NAME, 
                COUNT(*) as index_count
            FROM 
                information_schema.STATISTICS 
            WHERE 
                TABLE_SCHEMA = :dbName
                AND TABLE_NAME IN ('users', 'orders')
            GROUP BY 
                TABLE_NAME 
            ORDER BY 
                index_count DESC
        `, {
            replacements: { dbName },
            type: sequelize.QueryTypes.SELECT
        });

        const finalStatsArray = Array.isArray(finalStats) ? finalStats : [];

        console.log('Index par table (APRÈS nettoyage) :');
        console.log('=====================================');
        finalStatsArray.forEach(stat => {
            const status = stat.index_count > 50 ? '⚠️' : '✅';
            console.log(`  ${status} ${stat.TABLE_NAME}: ${stat.index_count} index`);
        });
        console.log('');

        // Vérifier s'il reste des problèmes
        const problematicTables = finalStatsArray.filter(s => s.index_count > 50);
        if (problematicTables.length > 0) {
            console.log('⚠️  ATTENTION : Certaines tables ont encore plus de 50 index :');
            problematicTables.forEach(t => {
                console.log(`    - ${t.TABLE_NAME}: ${t.index_count} index`);
            });
        } else {
            console.log('✅ Toutes les tables ont moins de 50 index !\n');
        }

        console.log('✅ Nettoyage terminé !\n');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    removeDuplicateIndexes();
}

module.exports = { removeDuplicateIndexes };


