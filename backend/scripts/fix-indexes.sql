-- ============================================
-- SCRIPT DE NETTOYAGE DES INDEX - CamCook
-- ============================================
-- 
-- OBJECTIF : Supprimer les index en double pour résoudre l'erreur
-- "Trop de clefs sont définies. Maximum de 64 clefs alloué"
--
-- IMPORTANT : 
-- 1. Faire une sauvegarde de la base de données avant d'exécuter ce script
-- 2. Exécuter ce script dans une transaction si possible
-- 3. Vérifier les index avant de les supprimer
--
-- USAGE :
-- mysql -u root -p camcook < backend/scripts/fix-indexes.sql
-- 
-- ============================================

-- Utiliser la base de données
USE camcook;

-- ============================================
-- ÉTAPE 1 : ANALYSE DES INDEX EXISTANTS
-- ============================================
-- Afficher le nombre d'index par table pour identifier les problèmes

SELECT 
    TABLE_NAME, 
    COUNT(*) as index_count,
    GROUP_CONCAT(DISTINCT INDEX_NAME ORDER BY INDEX_NAME SEPARATOR ', ') as index_names
FROM 
    information_schema.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'camcook'
    AND TABLE_NAME IN (
        'restaurants', 'users', 'menu_items', 'orders', 
        'accompaniments', 'drinks', 'contact_messages', 
        'reviews', 'questions', 'addresses'
    )
GROUP BY 
    TABLE_NAME 
ORDER BY 
    index_count DESC;

-- ============================================
-- ÉTAPE 2 : LISTER TOUS LES INDEX PAR TABLE
-- ============================================
-- Décommentez les lignes ci-dessous pour voir les index détaillés

-- SHOW INDEX FROM restaurants;
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM menu_items;
-- SHOW INDEX FROM orders;
-- SHOW INDEX FROM accompaniments;
-- SHOW INDEX FROM drinks;
-- SHOW INDEX FROM contact_messages;
-- SHOW INDEX FROM reviews;
-- SHOW INDEX FROM questions;
-- SHOW INDEX FROM addresses;

-- ============================================
-- ÉTAPE 3 : SUPPRESSION DES INDEX EN DOUBLE
-- ============================================
-- 
-- STRATÉGIE :
-- 1. Garder les PRIMARY KEY (obligatoires)
-- 2. Garder les FOREIGN KEY (pour les relations)
-- 3. Garder les UNIQUE constraints (slug, subdomain, email, etc.)
-- 4. Garder un seul index de performance par colonne (restaurantId)
-- 5. Supprimer les index en double ou redondants
--
-- ============================================

-- ============================================
-- TABLE: restaurants
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - ownerId (FK vers users)
-- - slug (UNIQUE)
-- - subdomain (UNIQUE)
-- - email (UNIQUE si présent)

-- Supprimer les index en double sur restaurantId (sauf FK)
-- Note : Vérifiez d'abord avec SHOW INDEX FROM restaurants
DROP INDEX IF EXISTS `restaurants_restaurantId` ON restaurants;
DROP INDEX IF EXISTS `restaurants_restaurant_id` ON restaurants;
DROP INDEX IF EXISTS `idx_restaurants_restaurantId` ON restaurants;

-- Supprimer les index redondants sur slug/subdomain
-- (garder uniquement les UNIQUE constraints)
DROP INDEX IF EXISTS `restaurants_slug` ON restaurants;
DROP INDEX IF EXISTS `idx_restaurants_slug` ON restaurants;
DROP INDEX IF EXISTS `restaurants_subdomain` ON restaurants;
DROP INDEX IF EXISTS `idx_restaurants_subdomain` ON restaurants;

-- ============================================
-- TABLE: users
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - email (UNIQUE)

-- Supprimer les index en double sur email
DROP INDEX IF EXISTS `users_email` ON users;
DROP INDEX IF EXISTS `idx_users_email` ON users;

-- ============================================
-- TABLE: menu_items
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - restaurantId (FK vers restaurants)
-- - restaurantId (index de performance)

-- Supprimer les index en double sur restaurantId
DROP INDEX IF EXISTS `menu_items_restaurantId` ON menu_items;
DROP INDEX IF EXISTS `menu_items_restaurant_id` ON menu_items;
DROP INDEX IF EXISTS `idx_menu_items_restaurantId` ON menu_items;

-- Garder uniquement l'index FK (Sequelize le crée automatiquement)
-- Si plusieurs index restaurantId existent, garder le plus récent

-- ============================================
-- TABLE: orders
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - customerId (FK vers users)
-- - restaurantId (FK vers restaurants)
-- - orderNumber (UNIQUE)

-- Supprimer les index en double
DROP INDEX IF EXISTS `orders_customerId` ON orders;
DROP INDEX IF EXISTS `orders_customer_id` ON orders;
DROP INDEX IF EXISTS `idx_orders_customerId` ON orders;
DROP INDEX IF EXISTS `orders_restaurantId` ON orders;
DROP INDEX IF EXISTS `orders_restaurant_id` ON orders;
DROP INDEX IF EXISTS `idx_orders_restaurantId` ON orders;
DROP INDEX IF EXISTS `orders_orderNumber` ON orders;
DROP INDEX IF EXISTS `idx_orders_orderNumber` ON orders;

-- ============================================
-- TABLE: accompaniments
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - restaurantId (FK vers restaurants)
-- - unique_accompaniment_per_restaurant (UNIQUE composite)

-- Supprimer les index en double sur restaurantId
-- Garder uniquement l'index FK et l'index unique composite
DROP INDEX IF EXISTS `accompaniments_restaurantId` ON accompaniments;
DROP INDEX IF EXISTS `accompaniments_restaurant_id` ON accompaniments;
DROP INDEX IF EXISTS `idx_accompaniments_restaurantId` ON accompaniments;

-- Supprimer les index en double sur le composite unique
DROP INDEX IF EXISTS `accompaniments_name_restaurantId` ON accompaniments;
DROP INDEX IF EXISTS `idx_accompaniments_name_restaurantId` ON accompaniments;

-- ============================================
-- TABLE: drinks
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - restaurantId (FK vers restaurants)
-- - unique_drink_per_restaurant (UNIQUE composite)

-- Supprimer les index en double sur restaurantId
DROP INDEX IF EXISTS `drinks_restaurantId` ON drinks;
DROP INDEX IF EXISTS `drinks_restaurant_id` ON drinks;
DROP INDEX IF EXISTS `idx_drinks_restaurantId` ON drinks;

-- Supprimer les index en double sur le composite unique
DROP INDEX IF EXISTS `drinks_name_restaurantId` ON drinks;
DROP INDEX IF EXISTS `idx_drinks_name_restaurantId` ON drinks;

-- ============================================
-- TABLE: contact_messages
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - restaurantId (FK vers restaurants)

-- Supprimer les index en double
DROP INDEX IF EXISTS `contact_messages_restaurantId` ON contact_messages;
DROP INDEX IF EXISTS `contact_messages_restaurant_id` ON contact_messages;
DROP INDEX IF EXISTS `idx_contact_messages_restaurantId` ON contact_messages;

-- ============================================
-- TABLE: reviews
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - menuItemId (FK vers menu_items)
-- - userId (FK vers users)

-- Supprimer les index en double
DROP INDEX IF EXISTS `reviews_menuItemId` ON reviews;
DROP INDEX IF EXISTS `reviews_menu_item_id` ON reviews;
DROP INDEX IF EXISTS `idx_reviews_menuItemId` ON reviews;
DROP INDEX IF EXISTS `reviews_userId` ON reviews;
DROP INDEX IF EXISTS `reviews_user_id` ON reviews;
DROP INDEX IF EXISTS `idx_reviews_userId` ON reviews;

-- ============================================
-- TABLE: questions
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - menuItemId (FK vers menu_items)
-- - userId (FK vers users)

-- Supprimer les index en double
DROP INDEX IF EXISTS `questions_menuItemId` ON questions;
DROP INDEX IF EXISTS `questions_menu_item_id` ON questions;
DROP INDEX IF EXISTS `idx_questions_menuItemId` ON questions;
DROP INDEX IF EXISTS `questions_userId` ON questions;
DROP INDEX IF EXISTS `questions_user_id` ON questions;
DROP INDEX IF EXISTS `idx_questions_userId` ON questions;

-- ============================================
-- TABLE: addresses
-- ============================================
-- Index à GARDER :
-- - PRIMARY (id)
-- - userId (FK vers users)

-- Supprimer les index en double
DROP INDEX IF EXISTS `addresses_userId` ON addresses;
DROP INDEX IF EXISTS `addresses_user_id` ON addresses;
DROP INDEX IF EXISTS `idx_addresses_userId` ON addresses;

-- ============================================
-- ÉTAPE 4 : VÉRIFICATION APRÈS NETTOYAGE
-- ============================================

-- Afficher le nombre d'index par table après nettoyage
SELECT 
    TABLE_NAME, 
    COUNT(*) as index_count,
    GROUP_CONCAT(DISTINCT INDEX_NAME ORDER BY INDEX_NAME SEPARATOR ', ') as index_names
FROM 
    information_schema.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'camcook'
    AND TABLE_NAME IN (
        'restaurants', 'users', 'menu_items', 'orders', 
        'accompaniments', 'drinks', 'contact_messages', 
        'reviews', 'questions', 'addresses'
    )
GROUP BY 
    TABLE_NAME 
ORDER BY 
    index_count DESC;

-- ============================================
-- ÉTAPE 5 : CRÉER LES INDEX ESSENTIELS MANQUANTS
-- ============================================
-- Si certains index critiques sont manquants, les créer ici

-- Index sur restaurantId pour les tables multi-tenant (si manquant)
-- Note : Les FK créent déjà un index, donc ces commandes peuvent échouer
-- mais c'est normal si l'index existe déjà via la FK

-- CREATE INDEX IF NOT EXISTS idx_restaurants_ownerId ON restaurants(ownerId);
-- CREATE INDEX IF NOT EXISTS idx_menu_items_restaurantId ON menu_items(restaurantId);
-- CREATE INDEX IF NOT EXISTS idx_orders_restaurantId ON orders(restaurantId);
-- CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders(customerId);
-- CREATE INDEX IF NOT EXISTS idx_accompaniments_restaurantId ON accompaniments(restaurantId);
-- CREATE INDEX IF NOT EXISTS idx_drinks_restaurantId ON drinks(restaurantId);
-- CREATE INDEX IF NOT EXISTS idx_contact_messages_restaurantId ON contact_messages(restaurantId);

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 
-- 1. Les PRIMARY KEY ne peuvent pas être supprimées
-- 2. Les FOREIGN KEY créent automatiquement des index
-- 3. Les UNIQUE constraints créent automatiquement des index
-- 4. MySQL limite à 64 index par table
-- 5. Si vous avez encore des erreurs, vérifiez les index sur :
--    - Les tables de jointure
--    - Les tables avec beaucoup de colonnes
--    - Les index composites multiples
--
-- ============================================
-- SCRIPT DE DIAGNOSTIC (optionnel)
-- ============================================
-- Décommentez pour voir tous les index en détail

/*
SELECT 
    s.TABLE_NAME,
    s.INDEX_NAME,
    s.COLUMN_NAME,
    s.SEQ_IN_INDEX,
    s.NON_UNIQUE,
    s.INDEX_TYPE,
    CASE 
        WHEN s.INDEX_NAME = 'PRIMARY' THEN 'Primary Key'
        WHEN s.NON_UNIQUE = 0 THEN 'Unique'
        WHEN s.INDEX_NAME LIKE '%fk%' OR s.INDEX_NAME LIKE '%foreign%' THEN 'Foreign Key'
        ELSE 'Index'
    END as index_type_description
FROM 
    information_schema.STATISTICS s
WHERE 
    s.TABLE_SCHEMA = 'camcook'
    AND s.TABLE_NAME IN (
        'restaurants', 'users', 'menu_items', 'orders', 
        'accompaniments', 'drinks', 'contact_messages', 
        'reviews', 'questions', 'addresses'
    )
ORDER BY 
    s.TABLE_NAME, 
    s.INDEX_NAME, 
    s.SEQ_IN_INDEX;
*/

-- ============================================
-- FIN DU SCRIPT
-- ============================================


