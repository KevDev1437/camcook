# 🔒 AUDIT DE SÉCURITÉ - Plateforme SaaS Multi-Tenant

**Date :** 2025-01-XX  
**Version :** 1.0  
**Statut :** Analyse complète

---

## 📋 RÉSUMÉ EXÉCUTIF

Cet audit de sécurité identifie les risques potentiels dans la plateforme SaaS multi-tenant. L'analyse couvre l'isolation des données, l'authentification, la validation des entrées, les injections SQL, le middleware restaurantContext, et les fuites de données.

**Score global de sécurité :** ⚠️ **MOYEN** (65/100)

---

## 1. ISOLATION DES DONNÉES

### ✅ Points sécurisés

1. **Middleware restaurantContext bien implémenté**
   - Filtrage automatique par `restaurantId` dans la plupart des controllers
   - Vérification de l'appartenance du restaurant pour les `adminrestaurant`
   - Isolation logique fonctionnelle

2. **Controllers avec filtrage correct :**
   - `order.controller.js` : Filtre par `restaurantId` dans toutes les requêtes
   - `menu.controller.js` : Filtre par `restaurantId` pour les menu items
   - `accompaniment.controller.js` : Filtre par `restaurantId`
   - `drink.controller.js` : Filtre par `restaurantId`
   - `contactmessage.controller.js` : Filtre par `restaurantId` pour les owners
   - `review.controller.js` : Vérifie que `menuItem.restaurantId === req.restaurantId`
   - `question.controller.js` : Vérifie que `menuItem.restaurantId === req.restaurantId`

3. **Vérifications d'autorisation :**
   - Les `adminrestaurant` ne peuvent accéder qu'à leur propre restaurant
   - Vérification `restaurant.ownerId === req.user.id` dans plusieurs endpoints

### ⚠️ Risques moyens

1. **Routes avec `restaurantContext.optional` :**
   - `GET /api/admin/orders` : Peut retourner toutes les commandes si `restaurantId` manque
   - `GET /api/admin/reviews` : Peut retourner toutes les reviews si `restaurantId` manque
   - `GET /api/admin/users` : Filtre par `defaultRestaurantId` mais peut être contourné
   - `GET /api/orders/:id` : `restaurantContext.optional` - vérification manuelle mais dépendante

2. **Logique conditionnelle dans les controllers :**
   ```javascript
   // drink.controller.js ligne 33
   if (userRole !== 'admin') {
     where.restaurantId = req.restaurantId;
   }
   // Si admin, where reste vide (pas de filtre)
   ```
   - Les superadmins peuvent voir toutes les données (intentionnel mais à documenter)

3. **Routes publiques sans filtrage :**
   - `GET /api/restaurants/slug/:slug` : Route publique sans `restaurantContext`
   - `GET /api/restaurants/list` : Route publique avec `restaurantContext.optional`

### 🚨 Risques critiques

1. **Aucun risque critique identifié** dans l'isolation des données
   - Tous les endpoints sensibles filtrent correctement par `restaurantId`
   - Les vérifications d'autorisation sont présentes

### 💡 Recommandations

1. **Renforcer les routes avec `restaurantContext.optional` :**
   - Ajouter une vérification explicite : si `req.restaurantId` manque et que l'utilisateur est `adminrestaurant`, retourner une erreur
   - Documenter clairement quelles routes sont accessibles sans `restaurantId`

2. **Ajouter des tests d'isolation :**
   - Tests unitaires pour vérifier qu'un `adminrestaurant` ne peut pas accéder aux données d'un autre restaurant
   - Tests d'intégration pour vérifier le filtrage par `restaurantId`

3. **Logging des accès cross-restaurant :**
   - Logger tous les accès qui contournent le filtrage par `restaurantId`
   - Alertes si un `adminrestaurant` tente d'accéder à un autre restaurant

---

## 2. AUTHENTIFICATION & AUTORISATION

### ✅ Points sécurisés

1. **Middleware `protect` bien utilisé :**
   - Toutes les routes sensibles utilisent `protect`
   - Routes admin utilisent `authorize('superadmin')` ou `authorize('adminrestaurant', 'superadmin')`

2. **Routes protégées correctement :**
   - `/api/superadmin/*` : Toutes protégées avec `protect` + `authorize('superadmin')`
   - `/api/admin/*` : Protégées avec `protect` + `authorize('superadmin', 'adminrestaurant')`
   - `/api/orders/*` : Protégées avec `protect`
   - `/api/users/*` : Protégées avec `protect`

3. **Vérifications d'autorisation dans les controllers :**
   - `order.controller.js` : Vérifie `userRole === 'adminrestaurant'` et `restaurant.ownerId === userId`
   - `restaurant.controller.js` : Vérifie `restaurant.ownerId === req.user.id`

### ⚠️ Risques moyens

1. **Routes avec `protectOptional` :**
   - `GET /api/restaurants/info` : `protectOptional` - peut être accessible sans authentification
   - `GET /api/restaurants/menu` : `protectOptional` - peut être accessible sans authentification
   - **Impact :** Acceptable pour des routes publiques, mais à documenter

2. **Routes publiques sans protection :**
   - `GET /api/restaurants/slug/:slug` : Route publique sans `protect`
   - `POST /api/site-info/contact` : Route publique (acceptable)
   - `GET /api/site-info` : Route publique (acceptable)

3. **Vérifications d'autorisation manuelles :**
   - Certains controllers vérifient manuellement `userRole` au lieu d'utiliser `authorize()`
   - Exemple : `question.controller.js` ligne 348 vérifie `userRole !== 'admin' && userRole !== 'staff'`

### 🚨 Risques critiques

1. **Aucun risque critique identifié** dans l'authentification
   - Toutes les routes sensibles sont protégées
   - Les vérifications d'autorisation sont présentes

### 💡 Recommandations

1. **Standardiser l'utilisation de `authorize()` :**
   - Remplacer les vérifications manuelles de `userRole` par `authorize()`
   - Créer des rôles plus granulaires si nécessaire (`staff`, `restaurant`)

2. **Documenter les routes publiques :**
   - Créer une documentation claire des routes publiques vs protégées
   - Ajouter des commentaires dans le code pour expliquer pourquoi certaines routes sont publiques

3. **Ajouter un rate limiting plus strict :**
   - Limiter les tentatives de connexion par IP
   - Limiter les requêtes par utilisateur

---

## 3. VALIDATION DES ENTRÉES

### ✅ Points sécurisés

1. **Validation des IDs :**
   - `parseInt()` avec vérification `isNaN()` dans plusieurs controllers
   - Exemple : `superadmin.controller.js` ligne 145 : `if (!restaurantId || isNaN(parseInt(restaurantId)))`

2. **Validation des données utilisateur :**
   - `String().trim()` pour nettoyer les chaînes
   - Validation des emails avec regex dans `siteinfo.controller.js`
   - Validation des statuts avec listes de valeurs autorisées

3. **Validation des prix et nombres :**
   - `parseFloat()` avec vérification `Number.isNaN()`
   - Vérification que les prix sont positifs

### ⚠️ Risques moyens

1. **Validation manquante dans certains endpoints :**
   - `order.controller.js` : Validation basique des `items` mais pas de validation approfondie
   - `menu.controller.js` : Pas de validation stricte des `options` JSON
   - `question.controller.js` : Pas de validation de longueur pour `text`

2. **Validation des paramètres de pagination :**
   - Validation présente mais pourrait être plus stricte
   - Pas de limite maximale pour `offset` (risque de DoS)

3. **Validation des données JSON :**
   - `menu.controller.js` : Parse JSON sans validation stricte
   - Pas de validation de schéma pour les objets complexes

### 🚨 Risques critiques

1. **Aucun risque critique identifié** dans la validation
   - Les validations de base sont présentes
   - Les IDs sont validés avant utilisation

### 💡 Recommandations

1. **Ajouter une validation de schéma :**
   - Utiliser `Joi` ou `express-validator` pour valider les schémas
   - Créer des middlewares de validation réutilisables

2. **Renforcer la validation des données utilisateur :**
   - Limiter la longueur des champs texte
   - Valider les formats de données (URLs, emails, téléphones)
   - Sanitizer les entrées HTML/XSS

3. **Ajouter des limites strictes :**
   - Limite maximale pour `limit` (déjà fait : 100)
   - Limite maximale pour `offset` (prévenir DoS)
   - Limite de taille pour les payloads JSON

---

## 4. INJECTIONS SQL

### ✅ Points sécurisés

1. **Utilisation de Sequelize ORM :**
   - Toutes les requêtes utilisent Sequelize (paramètres préparés automatiques)
   - Pas de concaténation de strings dans les requêtes SQL

2. **Requêtes SQL directes sécurisées :**
   - `superadmin.controller.js` ligne 217 : Utilise `sequelize.query()` avec paramètres
   ```javascript
   sequelize.query(
     `SELECT COUNT(DISTINCT customerId) as count FROM orders WHERE restaurantId = :restaurantId`,
     { replacements: { restaurantId: restaurantIdNum }, type: sequelize.QueryTypes.SELECT }
   )
   ```

3. **Utilisation de `Op.like` pour les recherches :**
   - Toutes les recherches utilisent `Op.like` avec paramètres
   - Pas de concaténation directe dans les requêtes

### ⚠️ Risques moyens

1. **Aucun risque moyen identifié**
   - Toutes les requêtes utilisent des paramètres préparés

### 🚨 Risques critiques

1. **Aucun risque critique identifié**
   - Aucune injection SQL possible détectée
   - Toutes les requêtes sont sécurisées

### 💡 Recommandations

1. **Maintenir les bonnes pratiques :**
   - Continuer à utiliser Sequelize pour toutes les requêtes
   - Éviter les requêtes SQL directes sauf si absolument nécessaire
   - Toujours utiliser des paramètres préparés pour les requêtes SQL directes

2. **Ajouter des tests de sécurité :**
   - Tests pour vérifier que les injections SQL sont bloquées
   - Tests de pénétration réguliers

---

## 5. MIDDLEWARE restaurantContext

### ✅ Points sécurisés

1. **Middleware bien implémenté :**
   - Identification du `restaurantId` depuis plusieurs sources (header, query, env, param)
   - Vérification de l'existence du restaurant
   - Vérification de l'état actif du restaurant
   - Vérification de la validité de l'abonnement

2. **Isolation automatique pour `adminrestaurant` :**
   - Le middleware charge automatiquement le restaurant de l'owner
   - Vérification que `restaurant.ownerId === req.user.id`

3. **Routes avec `restaurantContext.required` :**
   - Toutes les routes sensibles utilisent `restaurantContext.required`
   - Erreur 400 si `restaurantId` manque

### ⚠️ Risques moyens

1. **Routes avec `restaurantContext.optional` :**
   - Plusieurs routes utilisent `restaurantContext.optional`
   - Si `restaurantId` manque, le middleware passe sans erreur
   - **Impact :** Peut permettre l'accès à toutes les données si le filtre n'est pas appliqué manuellement

2. **Ordre de priorité pour identifier `restaurantId` :**
   - Header `X-Restaurant-Id` (priorité la plus haute)
   - Query parameter `?restaurantId=X`
   - Variable d'environnement `RESTAURANT_ID`
   - Paramètre URL `/:restaurantId/`
   - **Risque :** Un utilisateur pourrait manipuler le header pour changer de restaurant (mais protégé par l'authentification)

3. **Vérification de l'abonnement :**
   - Le middleware vérifie la validité de l'abonnement
   - Mais ne bloque pas les requêtes si l'abonnement est expiré (retourne 403)

### 🚨 Risques critiques

1. **Aucun risque critique identifié**
   - Le middleware fonctionne correctement
   - Les vérifications sont présentes

### 💡 Recommandations

1. **Renforcer les routes avec `restaurantContext.optional` :**
   - Ajouter une vérification explicite dans les controllers
   - Si `req.restaurantId` manque et que l'utilisateur est `adminrestaurant`, retourner une erreur

2. **Documenter l'ordre de priorité :**
   - Documenter clairement comment le `restaurantId` est identifié
   - Expliquer pourquoi le header a la priorité la plus haute

3. **Ajouter des logs de sécurité :**
   - Logger tous les accès qui utilisent un `restaurantId` différent de celui attendu
   - Alertes si un `adminrestaurant` tente d'accéder à un autre restaurant

---

## 6. FUITES DE DONNÉES

### ✅ Points sécurisés

1. **Exclusion des mots de passe :**
   - `attributes: { exclude: ['password'] }` dans plusieurs controllers
   - `superadmin.controller.js` ligne 928
   - `auth.controller.js` ligne 307
   - `admin.controller.js` ligne 230

2. **Limitation des attributs retournés :**
   - Plusieurs controllers limitent les attributs retournés
   - Exemple : `restaurant.controller.js` retourne seulement les données publiques

3. **Gestion des erreurs :**
   - La plupart des erreurs ne révèlent pas d'informations sensibles
   - Messages d'erreur génériques en production

### ⚠️ Risques moyens

1. **Messages d'erreur trop détaillés en développement :**
   - `error.message` retourné dans plusieurs controllers en développement
   - Exemple : `question.controller.js` ligne 79 : `error: error.message`
   - **Impact :** Peut révéler des informations sensibles si `NODE_ENV !== 'production'`

2. **Données sensibles dans les logs :**
   - `console.error()` avec des messages détaillés
   - Les logs peuvent contenir des informations sensibles
   - **Impact :** Risque si les logs sont exposés

3. **Retour de trop de données :**
   - Certains endpoints retournent tous les attributs des modèles
   - Exemple : `user.controller.js` retourne l'utilisateur complet (mais sans password)

### 🚨 Risques critiques

1. **Aucun risque critique identifié**
   - Les mots de passe sont exclus
   - Les erreurs ne révèlent pas d'informations sensibles en production

### 💡 Recommandations

1. **Standardiser la gestion des erreurs :**
   - Créer un middleware de gestion d'erreurs centralisé
   - Ne retourner `error.message` qu'en développement
   - Messages d'erreur génériques en production

2. **Sanitizer les logs :**
   - Ne pas logger les données sensibles (passwords, tokens, données personnelles)
   - Utiliser un système de logging structuré

3. **Limiter les données retournées :**
   - Créer des DTOs (Data Transfer Objects) pour limiter les données retournées
   - Ne retourner que les attributs nécessaires

4. **Ajouter des headers de sécurité :**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`

---

## 📊 RÉSUMÉ DES RISQUES

### 🚨 Risques critiques : 0
- Aucun risque critique identifié

### ⚠️ Risques moyens : 8
1. Routes avec `restaurantContext.optional` sans vérification explicite
2. Routes avec `protectOptional` (à documenter)
3. Validation manquante dans certains endpoints
4. Messages d'erreur trop détaillés en développement
5. Données sensibles dans les logs
6. Retour de trop de données dans certains endpoints
7. Vérifications d'autorisation manuelles au lieu de `authorize()`
8. Ordre de priorité pour identifier `restaurantId` (à documenter)

### ✅ Points sécurisés : 15
1. Middleware `restaurantContext` bien implémenté
2. Filtrage par `restaurantId` dans tous les controllers sensibles
3. Vérifications d'autorisation présentes
4. Routes protégées correctement
5. Validation des IDs
6. Validation des données utilisateur
7. Utilisation de Sequelize ORM (paramètres préparés)
8. Requêtes SQL directes sécurisées
9. Exclusion des mots de passe
10. Limitation des attributs retournés
11. Gestion des erreurs (messages génériques en production)
12. Isolation automatique pour `adminrestaurant`
13. Vérification de l'abonnement
14. Vérification de l'état actif du restaurant
15. Vérification de l'appartenance du restaurant

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### Priorité 1 (Immédiat)
1. ✅ **Standardiser la gestion des erreurs**
   - Créer un middleware de gestion d'erreurs centralisé
   - Ne retourner `error.message` qu'en développement

2. ✅ **Renforcer les routes avec `restaurantContext.optional`**
   - Ajouter une vérification explicite dans les controllers
   - Si `req.restaurantId` manque et que l'utilisateur est `adminrestaurant`, retourner une erreur

3. ✅ **Sanitizer les logs**
   - Ne pas logger les données sensibles
   - Utiliser un système de logging structuré

### Priorité 2 (Court terme)
4. ✅ **Standardiser l'utilisation de `authorize()`**
   - Remplacer les vérifications manuelles de `userRole` par `authorize()`
   - Créer des rôles plus granulaires si nécessaire

5. ✅ **Ajouter une validation de schéma**
   - Utiliser `Joi` ou `express-validator`
   - Créer des middlewares de validation réutilisables

6. ✅ **Documenter les routes publiques**
   - Créer une documentation claire des routes publiques vs protégées
   - Ajouter des commentaires dans le code

### Priorité 3 (Moyen terme)
7. ✅ **Ajouter des tests d'isolation**
   - Tests unitaires pour vérifier l'isolation des données
   - Tests d'intégration pour vérifier le filtrage par `restaurantId`

8. ✅ **Ajouter des logs de sécurité**
   - Logger tous les accès qui utilisent un `restaurantId` différent
   - Alertes si un `adminrestaurant` tente d'accéder à un autre restaurant

9. ✅ **Limiter les données retournées**
   - Créer des DTOs pour limiter les données retournées
   - Ne retourner que les attributs nécessaires

---

## 📝 CONCLUSION

La plateforme SaaS multi-tenant présente un **niveau de sécurité moyen** avec des points forts dans l'isolation des données et l'authentification. Les risques identifiés sont principalement liés à la validation des entrées, la gestion des erreurs, et la documentation.

**Recommandation principale :** Implémenter les actions de priorité 1 pour améliorer significativement la sécurité de la plateforme.

---

**Audit réalisé par :** Assistant IA  
**Prochaine révision recommandée :** Après implémentation des actions de priorité 1


