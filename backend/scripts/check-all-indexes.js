/**
 * Script pour vérifier TOUS les index de TOUTES les tables
 * 
 * Affiche le nombre d'index par table pour identifier les problèmes
 * 
 * Usage: node backend/scripts/check-all-indexes.js
 */

const { sequelize } = require('../src/config/database');

async function checkAllIndexes() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        const dbName = sequelize.config.database;
        
        // Récupérer le nombre d'index par table
        const stats = await sequelize.query(`
            SELECT 
                TABLE_NAME, 
                COUNT(*) as index_count
            FROM 
                information_schema.STATISTICS 
            WHERE 
                TABLE_SCHEMA = :dbName
            GROUP BY 
                TABLE_NAME 
            ORDER BY 
                index_count DESC
        `, {
            replacements: { dbName },
            type: sequelize.QueryTypes.SELECT
        });

        const statsArray = Array.isArray(stats) ? stats : [];

        console.log('📊 Nombre d\'index par table :');
        console.log('=====================================');
        
        let problematicTables = [];
        
        statsArray.forEach(stat => {
            const status = stat.index_count > 20 ? '❌' : stat.index_count > 10 ? '⚠️' : '✅';
            console.log(`  ${status} ${stat.TABLE_NAME}: ${stat.index_count} index`);
            
            if (stat.index_count > 20) {
                problematicTables.push(stat);
            }
        });
        console.log('');

        // Afficher les détails des tables problématiques
        if (problematicTables.length > 0) {
            console.log('❌ Tables avec plus de 20 index (PROBLÉMATIQUES) :');
            console.log('==================================================');
            
            for (const table of problematicTables) {
                console.log(`\n📋 Table: ${table.TABLE_NAME} (${table.index_count} index)`);
                
                // Lister tous les index de cette table
                const indexes = await sequelize.query(`
                    SELECT 
                        INDEX_NAME,
                        COLUMN_NAME,
                        NON_UNIQUE,
                        SEQ_IN_INDEX
                    FROM 
                        information_schema.STATISTICS 
                    WHERE 
                        TABLE_SCHEMA = :dbName
                        AND TABLE_NAME = :tableName
                    ORDER BY 
                        INDEX_NAME, SEQ_IN_INDEX
                `, {
                    replacements: { dbName, tableName: table.TABLE_NAME },
                    type: sequelize.QueryTypes.SELECT
                });

                const indexesArray = Array.isArray(indexes) ? indexes : [];
                
                // Grouper par INDEX_NAME
                const indexGroups = {};
                indexesArray.forEach(idx => {
                    if (!indexGroups[idx.INDEX_NAME]) {
                        indexGroups[idx.INDEX_NAME] = [];
                    }
                    indexGroups[idx.INDEX_NAME].push(idx);
                });

                console.log(`   Index (${Object.keys(indexGroups).length} index uniques) :`);
                Object.keys(indexGroups).forEach(indexName => {
                    const cols = indexGroups[indexName].map(i => i.COLUMN_NAME).join(', ');
                    const unique = indexGroups[indexName][0].NON_UNIQUE === 0 ? 'UNIQUE' : '';
                    console.log(`     - ${indexName} ${unique} (${cols})`);
                });
            }
        }

        // Total d'index
        const totalIndexes = statsArray.reduce((sum, stat) => sum + parseInt(stat.index_count), 0);
        console.log(`\n📊 Total d'index dans la base de données : ${totalIndexes}`);
        
        if (totalIndexes > 500) {
            console.log('⚠️  ATTENTION : Le total d\'index est très élevé !');
        }

        console.log('\n✅ Vérification terminée !\n');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    checkAllIndexes();
}

module.exports = { checkAllIndexes };


