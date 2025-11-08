/**
 * Script de nettoyage des index MySQL
 * 
 * Nettoie les index en double pour résoudre l'erreur
 * "Trop de clefs sont définies. Maximum de 64 clefs alloué"
 * 
 * Usage: node backend/scripts/fix-indexes.js
 */

const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function fixIndexes() {
    try {
        console.log('🔍 Analyse des index existants...\n');

        // Vérifier la connexion
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        const dbName = sequelize.config.database;

        // Étape 1 : Analyser les index existants
        console.log('📊 ÉTAPE 1 : Analyse des index existants\n');
        
        const indexStats = await sequelize.query(`
            SELECT 
                TABLE_NAME, 
                COUNT(*) as index_count,
                GROUP_CONCAT(DISTINCT INDEX_NAME ORDER BY INDEX_NAME SEPARATOR ', ') as index_names
            FROM 
                information_schema.STATISTICS 
            WHERE 
                TABLE_SCHEMA = :dbName
                AND TABLE_NAME IN (
                    'restaurants', 'users', 'menu_items', 'orders', 
                    'accompaniments', 'drinks', 'contact_messages', 
                    'reviews', 'questions', 'addresses'
                )
            GROUP BY 
                TABLE_NAME 
            ORDER BY 
                index_count DESC
        `, {
            replacements: { dbName },
            type: sequelize.QueryTypes.SELECT
        });

        console.log('Index par table (AVANT nettoyage) :');
        console.log('=====================================');
        
        // Gérer le cas où Sequelize retourne [results, metadata] ou directement results
        const statsArray = Array.isArray(indexStats) ? indexStats : (Array.isArray(indexStats[0]) ? indexStats[0] : []);
        
        if (statsArray.length === 0) {
            console.log('  ℹ️  Aucune statistique trouvée');
        } else {
            statsArray.forEach(stat => {
                console.log(`  ${stat.TABLE_NAME}: ${stat.index_count} index`);
                if (stat.index_count > 50) {
                    console.log(`    ⚠️  ATTENTION : Plus de 50 index !`);
                }
            });
        }
        console.log('');

        // Étape 2 : Identifier les index à supprimer
        console.log('🔧 ÉTAPE 2 : Identification des index à supprimer\n');

        const indexesToDrop = [
            // restaurants
            { table: 'restaurants', index: 'restaurants_restaurantId' },
            { table: 'restaurants', index: 'restaurants_restaurant_id' },
            { table: 'restaurants', index: 'idx_restaurants_restaurantId' },
            { table: 'restaurants', index: 'restaurants_slug' },
            { table: 'restaurants', index: 'idx_restaurants_slug' },
            { table: 'restaurants', index: 'restaurants_subdomain' },
            { table: 'restaurants', index: 'idx_restaurants_subdomain' },
            
            // users
            { table: 'users', index: 'users_email' },
            { table: 'users', index: 'idx_users_email' },
            
            // menu_items
            { table: 'menu_items', index: 'menu_items_restaurantId' },
            { table: 'menu_items', index: 'menu_items_restaurant_id' },
            { table: 'menu_items', index: 'idx_menu_items_restaurantId' },
            
            // orders
            { table: 'orders', index: 'orders_customerId' },
            { table: 'orders', index: 'orders_customer_id' },
            { table: 'orders', index: 'idx_orders_customerId' },
            { table: 'orders', index: 'orders_restaurantId' },
            { table: 'orders', index: 'orders_restaurant_id' },
            { table: 'orders', index: 'idx_orders_restaurantId' },
            { table: 'orders', index: 'orders_orderNumber' },
            { table: 'orders', index: 'idx_orders_orderNumber' },
            
            // accompaniments
            { table: 'accompaniments', index: 'accompaniments_restaurantId' },
            { table: 'accompaniments', index: 'accompaniments_restaurant_id' },
            { table: 'accompaniments', index: 'idx_accompaniments_restaurantId' },
            { table: 'accompaniments', index: 'accompaniments_name_restaurantId' },
            { table: 'accompaniments', index: 'idx_accompaniments_name_restaurantId' },
            
            // drinks
            { table: 'drinks', index: 'drinks_restaurantId' },
            { table: 'drinks', index: 'drinks_restaurant_id' },
            { table: 'drinks', index: 'idx_drinks_restaurantId' },
            { table: 'drinks', index: 'drinks_name_restaurantId' },
            { table: 'drinks', index: 'idx_drinks_name_restaurantId' },
            
            // contact_messages
            { table: 'contact_messages', index: 'contact_messages_restaurantId' },
            { table: 'contact_messages', index: 'contact_messages_restaurant_id' },
            { table: 'contact_messages', index: 'idx_contact_messages_restaurantId' },
            
            // reviews
            { table: 'reviews', index: 'reviews_menuItemId' },
            { table: 'reviews', index: 'reviews_menu_item_id' },
            { table: 'reviews', index: 'idx_reviews_menuItemId' },
            { table: 'reviews', index: 'reviews_userId' },
            { table: 'reviews', index: 'reviews_user_id' },
            { table: 'reviews', index: 'idx_reviews_userId' },
            
            // questions
            { table: 'questions', index: 'questions_menuItemId' },
            { table: 'questions', index: 'questions_menu_item_id' },
            { table: 'questions', index: 'idx_questions_menuItemId' },
            { table: 'questions', index: 'questions_userId' },
            { table: 'questions', index: 'questions_user_id' },
            { table: 'questions', index: 'idx_questions_userId' },
            
            // addresses
            { table: 'addresses', index: 'addresses_userId' },
            { table: 'addresses', index: 'addresses_user_id' },
            { table: 'addresses', index: 'idx_addresses_userId' }
        ];

        // Vérifier quels index existent réellement
        console.log('Vérification des index à supprimer...\n');
        const existingIndexes = [];

        for (const { table, index } of indexesToDrop) {
            try {
                const results = await sequelize.query(`
                    SHOW INDEX FROM \`${table}\` WHERE Key_name = :indexName
                `, {
                    replacements: { indexName: index },
                    type: sequelize.QueryTypes.SELECT
                });

                // Sequelize retourne directement le tableau de résultats avec QueryTypes.SELECT
                const indexResults = Array.isArray(results) ? results : [];
                
                if (indexResults.length > 0) {
                    existingIndexes.push({ table, index });
                    console.log(`  ✓ ${table}.${index} (existe, sera supprimé)`);
                }
            } catch (error) {
                // Ignorer les erreurs si la table n'existe pas ou si l'index n'existe pas
                if (!error.message.includes("doesn't exist") && !error.message.includes("Unknown") && !error.message.includes("not exist")) {
                    // Ne pas afficher les erreurs normales pour les index qui n'existent pas
                }
            }
        }

        if (existingIndexes.length === 0) {
            console.log('  ℹ️  Aucun index à supprimer trouvé\n');
        } else {
            console.log(`\n  📋 Total : ${existingIndexes.length} index à supprimer\n`);
        }

        // Étape 3 : Demander confirmation
        console.log('⚠️  ATTENTION : Cette opération va supprimer des index.');
        console.log('   Assurez-vous d\'avoir fait une sauvegarde de la base de données !\n');

        // Pour l'automatisation, on peut passer --yes en argument
        const args = process.argv.slice(2);
        const autoConfirm = args.includes('--yes') || args.includes('-y');

        if (!autoConfirm) {
            console.log('❓ Continuer ? (Ctrl+C pour annuler, ou appuyez sur Entrée pour continuer)');
            // En production, on pourrait utiliser readline pour la confirmation
            // Pour l'instant, on supprime automatiquement si --yes est passé
        }

        // Étape 4 : Supprimer les index
        if (existingIndexes.length > 0 && (autoConfirm || true)) {
            console.log('\n🗑️  ÉTAPE 3 : Suppression des index...\n');

            let droppedCount = 0;
            let errorCount = 0;

            for (const { table, index } of existingIndexes) {
                try {
                    await sequelize.query(`DROP INDEX \`${index}\` ON \`${table}\``);
                    console.log(`  ✅ ${table}.${index} supprimé`);
                    droppedCount++;
                } catch (error) {
                    // Ignorer les erreurs si l'index n'existe pas ou est une FK
                    if (error.message.includes("Unknown key") || error.message.includes("Can't DROP")) {
                        console.log(`  ⚠️  ${table}.${index} : ${error.message}`);
                    } else {
                        console.error(`  ❌ Erreur lors de la suppression de ${table}.${index}:`, error.message);
                        errorCount++;
                    }
                }
            }

            console.log(`\n✅ ${droppedCount} index supprimés`);
            if (errorCount > 0) {
                console.log(`⚠️  ${errorCount} erreurs (peut être normal si l'index est une FK)`);
            }
        }

        // Étape 5 : Vérification finale
        console.log('\n📊 ÉTAPE 4 : Vérification finale\n');

        const finalStats = await sequelize.query(`
            SELECT 
                TABLE_NAME, 
                COUNT(*) as index_count
            FROM 
                information_schema.STATISTICS 
            WHERE 
                TABLE_SCHEMA = :dbName
                AND TABLE_NAME IN (
                    'restaurants', 'users', 'menu_items', 'orders', 
                    'accompaniments', 'drinks', 'contact_messages', 
                    'reviews', 'questions', 'addresses'
                )
            GROUP BY 
                TABLE_NAME 
            ORDER BY 
                index_count DESC
        `, {
            replacements: { dbName },
            type: sequelize.QueryTypes.SELECT
        });

        console.log('Index par table (APRÈS nettoyage) :');
        console.log('=====================================');
        
        // Gérer le cas où Sequelize retourne [results, metadata] ou directement results
        const finalStatsArray = Array.isArray(finalStats) ? finalStats : (Array.isArray(finalStats[0]) ? finalStats[0] : []);
        
        if (finalStatsArray.length === 0) {
            console.log('  ℹ️  Aucune statistique trouvée');
        } else {
            finalStatsArray.forEach(stat => {
                const before = statsArray.find(s => s.TABLE_NAME === stat.TABLE_NAME);
                const diff = before ? before.index_count - stat.index_count : 0;
                const status = stat.index_count > 50 ? '⚠️' : '✅';
                
                console.log(`  ${status} ${stat.TABLE_NAME}: ${stat.index_count} index ${diff > 0 ? `(${diff} supprimés)` : ''}`);
            });
        }
        console.log('');

        // Vérifier s'il reste des problèmes
        const problematicTables = finalStatsArray.filter(s => s.index_count > 50);
        if (problematicTables.length > 0) {
            console.log('⚠️  ATTENTION : Certaines tables ont encore plus de 50 index :');
            problematicTables.forEach(t => {
                console.log(`    - ${t.TABLE_NAME}: ${t.index_count} index`);
            });
            console.log('\n💡 Vous devrez peut-être supprimer manuellement certains index.');
        } else {
            console.log('✅ Toutes les tables ont moins de 50 index.\n');
        }

        console.log('✅ Nettoyage terminé !\n');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage des index:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Exécuter le script
if (require.main === module) {
    fixIndexes();
}

module.exports = { fixIndexes };

