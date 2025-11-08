/**
 * Script d'analyse détaillée des index
 * 
 * Analyse les index des tables problématiques (users et orders)
 * pour identifier les doublons et index non essentiels
 * 
 * Usage: node backend/scripts/analyze-indexes.js
 */

const { sequelize } = require('../src/config/database');

async function analyzeIndexes() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        const dbName = sequelize.config.database;

        // Tables problématiques
        const problematicTables = ['users', 'orders'];

        for (const tableName of problematicTables) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📊 ANALYSE DE LA TABLE: ${tableName.toUpperCase()}`);
            console.log('='.repeat(60));

            // Récupérer tous les index de la table
            const indexes = await sequelize.query(`
                SELECT 
                    INDEX_NAME,
                    COLUMN_NAME,
                    SEQ_IN_INDEX,
                    NON_UNIQUE,
                    INDEX_TYPE,
                    CASE 
                        WHEN INDEX_NAME = 'PRIMARY' THEN 'PRIMARY KEY'
                        WHEN NON_UNIQUE = 0 THEN 'UNIQUE'
                        WHEN INDEX_NAME LIKE '%fk%' OR INDEX_NAME LIKE '%foreign%' THEN 'FOREIGN KEY'
                        ELSE 'INDEX'
                    END as index_type_description
                FROM 
                    information_schema.STATISTICS 
                WHERE 
                    TABLE_SCHEMA = :dbName
                    AND TABLE_NAME = :tableName
                ORDER BY 
                    INDEX_NAME, 
                    SEQ_IN_INDEX
            `, {
                replacements: { dbName, tableName },
                type: sequelize.QueryTypes.SELECT
            });

            // Gérer le format de retour de Sequelize
            const indexesArray = Array.isArray(indexes) ? indexes : [];

            // Grouper par nom d'index
            const indexGroups = {};
            indexesArray.forEach(idx => {
                if (!indexGroups[idx.INDEX_NAME]) {
                    indexGroups[idx.INDEX_NAME] = {
                        name: idx.INDEX_NAME,
                        type: idx.index_type_description,
                        unique: idx.NON_UNIQUE === 0,
                        columns: [],
                        isFK: idx.INDEX_NAME.includes('fk') || idx.INDEX_NAME.includes('foreign') || idx.INDEX_NAME.includes('_id')
                    };
                }
                indexGroups[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
            });

            // Afficher les index
            console.log(`\n📋 Total: ${Object.keys(indexGroups).length} index\n`);
            
            const indexList = Object.values(indexGroups);
            
            // Séparer par type
            const primaryKeys = indexList.filter(idx => idx.type === 'PRIMARY KEY');
            const uniqueIndexes = indexList.filter(idx => idx.type === 'UNIQUE' && idx.type !== 'PRIMARY KEY');
            const foreignKeys = indexList.filter(idx => idx.isFK || idx.name.includes('Id'));
            const regularIndexes = indexList.filter(idx => 
                idx.type === 'INDEX' && 
                !idx.isFK && 
                !idx.name.includes('Id') &&
                idx.type !== 'PRIMARY KEY' &&
                idx.type !== 'UNIQUE'
            );

            console.log('🔑 PRIMARY KEYS (ne pas supprimer) :');
            primaryKeys.forEach(idx => {
                console.log(`  - ${idx.name} (${idx.columns.join(', ')})`);
            });

            console.log('\n🔒 UNIQUE INDEXES (nécessaires) :');
            uniqueIndexes.forEach(idx => {
                console.log(`  - ${idx.name} (${idx.columns.join(', ')})`);
            });

            console.log('\n🔗 FOREIGN KEY INDEXES (nécessaires, ne pas supprimer) :');
            foreignKeys.forEach(idx => {
                console.log(`  - ${idx.name} (${idx.columns.join(', ')})`);
            });

            console.log('\n📌 REGULAR INDEXES (peut-être supprimables) :');
            regularIndexes.forEach(idx => {
                console.log(`  - ${idx.name} (${idx.columns.join(', ')})`);
            });

            // Identifier les index en double (même colonnes)
            console.log('\n🔍 IDENTIFICATION DES DOUBLONS :');
            const columnGroups = {};
            indexList.forEach(idx => {
                const key = idx.columns.sort().join(',');
                if (!columnGroups[key]) {
                    columnGroups[key] = [];
                }
                columnGroups[key].push(idx);
            });

            let duplicatesFound = false;
            Object.entries(columnGroups).forEach(([columns, indexes]) => {
                if (indexes.length > 1) {
                    duplicatesFound = true;
                    console.log(`\n  ⚠️  Doublons sur colonnes [${columns}]:`);
                    indexes.forEach(idx => {
                        const canDrop = idx.type === 'INDEX' && !idx.isFK && idx.name !== 'PRIMARY';
                        console.log(`    - ${idx.name} (${idx.type}) ${canDrop ? '✅ Supprimable' : '❌ Ne pas supprimer'}`);
                    });
                }
            });

            if (!duplicatesFound) {
                console.log('  ✅ Aucun doublon évident trouvé');
            }

            // Identifier les index potentiellement supprimables
            console.log('\n🗑️  INDEX POTENTIELLEMENT SUPPRIMABLES :');
            const removableIndexes = indexList.filter(idx => 
                idx.type === 'INDEX' && 
                !idx.isFK && 
                idx.name !== 'PRIMARY' &&
                !idx.name.includes('Id') &&
                !idx.name.includes('fk') &&
                !idx.name.includes('unique')
            );

            if (removableIndexes.length > 0) {
                removableIndexes.forEach(idx => {
                    console.log(`  - ${idx.name} (${idx.columns.join(', ')})`);
                });
            } else {
                console.log('  ℹ️  Aucun index évident à supprimer (tous semblent nécessaires)');
            }

            // Statistiques
            console.log('\n📊 STATISTIQUES :');
            console.log(`  - Total index: ${Object.keys(indexGroups).length}`);
            console.log(`  - PRIMARY KEYS: ${primaryKeys.length}`);
            console.log(`  - UNIQUE: ${uniqueIndexes.length}`);
            console.log(`  - FOREIGN KEYS (estimé): ${foreignKeys.length}`);
            console.log(`  - Regular indexes: ${regularIndexes.length}`);
            console.log(`  - Potentiellement supprimables: ${removableIndexes.length}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Analyse terminée');
        console.log('='.repeat(60));
        console.log('\n💡 RECOMMANDATIONS :');
        console.log('1. Les index liés aux FOREIGN KEYS ne peuvent pas être supprimés');
        console.log('2. Focus sur les index REGULIERS qui sont en double');
        console.log('3. Vérifiez les index créés par Sequelize automatiquement');
        console.log('4. Considérez la suppression des index sur colonnes peu utilisées');

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    analyzeIndexes();
}

module.exports = { analyzeIndexes };

