/**
 * Script pour supprimer TOUS les index en double
 * 
 * Supprime les index en double sur :
 * - restaurants : slug_2 à slug_30, subdomain_2 à subdomain_30
 * - accompaniments : name_2 à name_32
 * - drinks : name_2 à name_32
 * 
 * Garde uniquement : slug, subdomain, name (et les index composites)
 * 
 * Usage: node backend/scripts/remove-all-duplicate-indexes.js
 */

const { sequelize } = require('../src/config/database');

async function removeAllDuplicateIndexes() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        let totalDropped = 0;
        let totalErrors = 0;

        // ============================================
        // TABLE: restaurants - Supprimer slug_2 à slug_30
        // ============================================
        console.log('🗑️  Suppression des index UNIQUE en double sur restaurants.slug...\n');
        
        let droppedCount = 0;
        let errorCount = 0;

        // Supprimer slug_2 à slug_30
        for (let i = 2; i <= 30; i++) {
            const indexName = `slug_${i}`;
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON \`restaurants\``);
                console.log(`  ✅ ${indexName} supprimé`);
                droppedCount++;
            } catch (error) {
                if (error.message.includes("Unknown key") || error.message.includes("doesn't exist") || error.message.includes("Vérifiez s'il existe")) {
                    // L'index n'existe pas, c'est OK
                } else {
                    console.error(`  ❌ Erreur lors de la suppression de ${indexName}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`✅ ${droppedCount} index supprimés sur restaurants.slug`);
        totalDropped += droppedCount;
        totalErrors += errorCount;

        // ============================================
        // TABLE: restaurants - Supprimer subdomain_2 à subdomain_30
        // ============================================
        console.log('\n🗑️  Suppression des index UNIQUE en double sur restaurants.subdomain...\n');
        
        droppedCount = 0;
        errorCount = 0;

        // Supprimer subdomain_2 à subdomain_30
        for (let i = 2; i <= 30; i++) {
            const indexName = `subdomain_${i}`;
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON \`restaurants\``);
                console.log(`  ✅ ${indexName} supprimé`);
                droppedCount++;
            } catch (error) {
                if (error.message.includes("Unknown key") || error.message.includes("doesn't exist") || error.message.includes("Vérifiez s'il existe")) {
                    // L'index n'existe pas, c'est OK
                } else {
                    console.error(`  ❌ Erreur lors de la suppression de ${indexName}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`✅ ${droppedCount} index supprimés sur restaurants.subdomain`);
        totalDropped += droppedCount;
        totalErrors += errorCount;

        // ============================================
        // TABLE: accompaniments - Supprimer name_2 à name_32
        // ============================================
        console.log('\n🗑️  Suppression des index UNIQUE en double sur accompaniments.name...\n');
        
        droppedCount = 0;
        errorCount = 0;

        // Supprimer name_2 à name_32
        for (let i = 2; i <= 32; i++) {
            const indexName = `name_${i}`;
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON \`accompaniments\``);
                console.log(`  ✅ ${indexName} supprimé`);
                droppedCount++;
            } catch (error) {
                if (error.message.includes("Unknown key") || error.message.includes("doesn't exist") || error.message.includes("Vérifiez s'il existe")) {
                    // L'index n'existe pas, c'est OK
                } else {
                    console.error(`  ❌ Erreur lors de la suppression de ${indexName}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`✅ ${droppedCount} index supprimés sur accompaniments.name`);
        totalDropped += droppedCount;
        totalErrors += errorCount;

        // ============================================
        // TABLE: drinks - Supprimer name_2 à name_32
        // ============================================
        console.log('\n🗑️  Suppression des index UNIQUE en double sur drinks.name...\n');
        
        droppedCount = 0;
        errorCount = 0;

        // Supprimer name_2 à name_32
        for (let i = 2; i <= 32; i++) {
            const indexName = `name_${i}`;
            try {
                await sequelize.query(`DROP INDEX \`${indexName}\` ON \`drinks\``);
                console.log(`  ✅ ${indexName} supprimé`);
                droppedCount++;
            } catch (error) {
                if (error.message.includes("Unknown key") || error.message.includes("doesn't exist") || error.message.includes("Vérifiez s'il existe")) {
                    // L'index n'existe pas, c'est OK
                } else {
                    console.error(`  ❌ Erreur lors de la suppression de ${indexName}:`, error.message);
                    errorCount++;
                }
            }
        }

        console.log(`✅ ${droppedCount} index supprimés sur drinks.name`);
        totalDropped += droppedCount;
        totalErrors += errorCount;

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
                AND TABLE_NAME IN ('restaurants', 'accompaniments', 'drinks')
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
            const status = stat.index_count > 20 ? '⚠️' : '✅';
            console.log(`  ${status} ${stat.TABLE_NAME}: ${stat.index_count} index`);
        });
        console.log('');

        // Vérifier s'il reste des problèmes
        const problematicTables = finalStatsArray.filter(s => s.index_count > 20);
        if (problematicTables.length > 0) {
            console.log('⚠️  ATTENTION : Certaines tables ont encore plus de 20 index :');
            problematicTables.forEach(t => {
                console.log(`    - ${t.TABLE_NAME}: ${t.index_count} index`);
            });
        } else {
            console.log('✅ Toutes les tables ont moins de 20 index !\n');
        }

        console.log(`\n📊 Résumé :`);
        console.log(`   ✅ ${totalDropped} index supprimés`);
        if (totalErrors > 0) {
            console.log(`   ⚠️  ${totalErrors} erreurs (index inexistants)`);
        }
        console.log('\n✅ Nettoyage terminé !\n');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        // Ne pas fermer la connexion si appelé depuis database.js
        if (require.main === module) {
            await sequelize.close();
            process.exit(1);
        } else {
            throw error; // Re-lancer l'erreur pour que database.js puisse la gérer
        }
    } finally {
        // Ne fermer la connexion que si le script est exécuté directement
        if (require.main === module) {
            await sequelize.close();
        }
    }
}

if (require.main === module) {
    removeAllDuplicateIndexes();
}

module.exports = { removeAllDuplicateIndexes };


