-- ============================================
-- NETTOYAGE DES INDEX - TABLES users et orders
-- ============================================
-- 
-- Ces tables ont trop d'index (64 et 62 respectivement)
-- Ce script supprime les index en double et non essentiels
--
-- IMPORTANT : 
-- 1. Faire une sauvegarde avant d'exécuter
-- 2. Les FOREIGN KEY créent automatiquement des index
-- 3. Ne pas supprimer les index liés aux FK
--
-- ============================================

USE camcook;

-- ============================================
-- TABLE: users
-- ============================================

-- Voir tous les index de users
-- SHOW INDEX FROM users;

-- Supprimer les index en double (sauf FK et PRIMARY)
-- Note : Les index avec "_id" ou "Id" sont souvent des FK, ne pas les supprimer

-- Index potentiellement en double (à vérifier avant de supprimer)
DROP INDEX IF EXISTS `users_email` ON users;
DROP INDEX IF EXISTS `idx_users_email` ON users;
DROP INDEX IF EXISTS `email` ON users;

-- Index sur createdAt/updatedAt (souvent créés par Sequelize mais peu utilisés)
DROP INDEX IF EXISTS `users_createdAt` ON users;
DROP INDEX IF EXISTS `users_updatedAt` ON users;
DROP INDEX IF EXISTS `idx_users_createdAt` ON users;
DROP INDEX IF EXISTS `idx_users_updatedAt` ON users;

-- Index composites sur createdAt/updatedAt (souvent redondants)
DROP INDEX IF EXISTS `users_createdAt_updatedAt` ON users;
DROP INDEX IF EXISTS `idx_users_createdAt_updatedAt` ON users;

-- Index sur role (si plusieurs existent)
DROP INDEX IF EXISTS `users_role` ON users;
DROP INDEX IF EXISTS `idx_users_role` ON users;

-- Index sur phone (si plusieurs existent)
DROP INDEX IF EXISTS `users_phone` ON users;
DROP INDEX IF EXISTS `idx_users_phone` ON users;

-- ============================================
-- TABLE: orders
-- ============================================

-- Voir tous les index de orders
-- SHOW INDEX FROM orders;

-- Supprimer les index en double (sauf FK et PRIMARY)

-- Index sur orderNumber (garder uniquement l'UNIQUE)
DROP INDEX IF EXISTS `orders_orderNumber` ON orders;
DROP INDEX IF EXISTS `idx_orders_orderNumber` ON orders;
DROP INDEX IF EXISTS `orderNumber` ON orders;

-- Index sur status (souvent plusieurs index)
DROP INDEX IF EXISTS `orders_status` ON orders;
DROP INDEX IF EXISTS `idx_orders_status` ON orders;
DROP INDEX IF EXISTS `status` ON orders;

-- Index sur paymentStatus
DROP INDEX IF EXISTS `orders_paymentStatus` ON orders;
DROP INDEX IF EXISTS `idx_orders_paymentStatus` ON orders;
DROP INDEX IF EXISTS `paymentStatus` ON orders;

-- Index sur orderType
DROP INDEX IF EXISTS `orders_orderType` ON orders;
DROP INDEX IF EXISTS `idx_orders_orderType` ON orders;
DROP INDEX IF EXISTS `orderType` ON orders;

-- Index sur createdAt/updatedAt
DROP INDEX IF EXISTS `orders_createdAt` ON orders;
DROP INDEX IF EXISTS `orders_updatedAt` ON orders;
DROP INDEX IF EXISTS `idx_orders_createdAt` ON orders;
DROP INDEX IF EXISTS `idx_orders_updatedAt` ON orders;

-- Index composites sur createdAt/updatedAt
DROP INDEX IF EXISTS `orders_createdAt_updatedAt` ON orders;
DROP INDEX IF EXISTS `idx_orders_createdAt_updatedAt` ON orders;

-- Index composites sur status + createdAt (souvent redondants)
DROP INDEX IF EXISTS `orders_status_createdAt` ON orders;
DROP INDEX IF EXISTS `idx_orders_status_createdAt` ON orders;

-- Index composites sur restaurantId + status (garder restaurantId seul)
DROP INDEX IF EXISTS `orders_restaurantId_status` ON orders;
DROP INDEX IF EXISTS `idx_orders_restaurantId_status` ON orders;

-- Index composites sur customerId + status
DROP INDEX IF EXISTS `orders_customerId_status` ON orders;
DROP INDEX IF EXISTS `idx_orders_customerId_status` ON orders;

-- Index sur scheduledFor (si peu utilisé)
DROP INDEX IF EXISTS `orders_scheduledFor` ON orders;
DROP INDEX IF EXISTS `idx_orders_scheduledFor` ON orders;

-- Index sur completedAt
DROP INDEX IF EXISTS `orders_completedAt` ON orders;
DROP INDEX IF EXISTS `idx_orders_completedAt` ON orders;

-- Index sur estimatedReadyTime
DROP INDEX IF EXISTS `orders_estimatedReadyTime` ON orders;
DROP INDEX IF EXISTS `idx_orders_estimatedReadyTime` ON orders;

-- ============================================
-- VÉRIFICATION APRÈS NETTOYAGE
-- ============================================

SELECT 
    TABLE_NAME, 
    COUNT(*) as index_count
FROM 
    information_schema.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'camcook'
    AND TABLE_NAME IN ('users', 'orders')
GROUP BY 
    TABLE_NAME 
ORDER BY 
    index_count DESC;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
--
-- 1. Si vous avez encore trop d'index après ce script, vous devez :
--    a. Lister tous les index avec : SHOW INDEX FROM users;
--    b. Identifier manuellement les index en double
--    c. Supprimer les index non essentiels
--
-- 2. Les FOREIGN KEY créent automatiquement des index.
--    Si vous avez trop de FK, considérez :
--    - Normaliser la base de données
--    - Réduire le nombre de relations
--    - Utiliser des relations optionnelles
--
-- 3. Les index sur createdAt/updatedAt sont souvent peu utilisés
--    sauf si vous faites beaucoup de requêtes par date
--
-- 4. Les index composites sont utiles pour les requêtes complexes
--    mais peuvent être redondants si vous avez déjà un index sur la première colonne
--
-- ============================================


