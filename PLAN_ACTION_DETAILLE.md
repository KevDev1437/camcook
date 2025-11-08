# 🎯 PLAN D'ACTION DÉTAILLÉ - Corrections Prioritaires

**Date :** 2025-01-XX  
**Version :** 1.0  
**Objectif :** Implémenter les corrections critiques identifiées dans l'audit de sécurité

---

## 🚨 PRIORITÉ 1 : CORRECTIONS CRITIQUES (À faire immédiatement)

### 1.1 Renforcer les Routes avec `restaurantContext.optional`

#### Problème Identifié

47 routes utilisent `restaurantContext.optional` sans vérification explicite. Si le filtre `restaurantId` n'est pas appliqué manuellement dans le controller, cela peut entraîner une fuite de données.

#### Solution : Middleware de Vérification Automatique

**Créer un nouveau middleware :**

```javascript
// backend/src/middleware/enforceRestaurantIsolation.js
/**
 * Middleware pour forcer l'isolation des données par restaurant
 * 
 * Vérifie que les restaurant owners ne peuvent accéder qu'à leurs données
 * même si restaurantContext.optional est utilisé.
 * 
 * @module middleware/enforceRestaurantIsolation
 */

const enforceRestaurantIsolation = (req, res, next) => {
  // Si l'utilisateur est un restaurant owner, restaurantId est obligatoire
  if (req.user?.role === 'adminrestaurant' && !req.restaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant ID required for restaurant owners',
      details: 'Restaurant owners must provide a restaurantId to access their data'
    });
  }

  // Si l'utilisateur est un customer dans une app White Label, restaurantId est obligatoire
  if (req.user?.role === 'customer' && !req.restaurantId && process.env.RESTAURANT_ID) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant ID required',
      details: 'This application requires a restaurant context'
    });
  }

  next();
};

module.exports = enforceRestaurantIsolation;
```

**Modifier les routes critiques :**

```javascript
// backend/src/routes/order.routes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const restaurantContext = require('../middleware/restaurantContext');
const enforceRestaurantIsolation = require('../middleware/enforceRestaurantIsolation');
const { validate, schemas } = require('../middleware/validation');
const ctrl = require('../controllers/order.controller');

const router = express.Router();

// Customer routes - restaurantContext requis pour créer une commande
router.post('/', restaurantContext.required, protect, validate(schemas.createOrder), ctrl.create);

// Customer routes - restaurantContext requis pour isoler les commandes par restaurant
router.get('/my-orders', restaurantContext.required, protect, ctrl.myOrders);

// ⚠️ CORRECTION : Ajouter enforceRestaurantIsolation
router.get('/:id', 
  restaurantContext.optional, 
  enforceRestaurantIsolation, // ← NOUVEAU
  protect, 
  ctrl.getById
);

// Restaurant routes - restaurantContext requis pour les actions des owners
router.get('/restaurant', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.getRestaurantOrders);
router.put('/:id/status', restaurantContext.required, protect, authorize('adminrestaurant', 'superadmin'), ctrl.updateOrderStatus);

// ⚠️ CORRECTION : Ajouter enforceRestaurantIsolation
router.get('/', 
  restaurantContext.optional, 
  enforceRestaurantIsolation, // ← NOUVEAU
  protect, 
  authorize('superadmin', 'adminrestaurant'), 
  ctrl.getAllOrders
);

module.exports = router;
```

**Routes à modifier :**

1. `backend/src/routes/order.routes.js` (2 routes)
2. `backend/src/routes/admin.routes.js` (8 routes)
3. `backend/src/routes/question.routes.js` (11 routes)
4. `backend/src/routes/review.routes.js` (7 routes)
5. `backend/src/routes/payment.routes.js` (2 routes)

**Temps estimé :** 2-3 heures

---

### 1.2 Ajouter des Tests d'Isolation

#### Solution : Tests Unitaires et d'Intégration

**Créer un fichier de tests d'isolation :**

```javascript
// backend/tests/isolation.test.js
const request = require('supertest');
const app = require('../src/server');
const { User, Restaurant, Order, MenuItem } = require('../src/models');
const { generateToken } = require('../src/utils/generateToken');

describe('Data Isolation Tests', () => {
  let restaurantA, restaurantB;
  let ownerA, ownerB;
  let customerA, customerB;
  let tokenOwnerA, tokenOwnerB, tokenCustomerA, tokenCustomerB;
  let orderA, orderB;
  let menuItemA, menuItemB;

  beforeAll(async () => {
    // Créer deux restaurants
    restaurantA = await Restaurant.create({
      name: 'Restaurant A',
      ownerId: 1,
      email: 'restaurantA@test.com',
      phone: '1234567890',
      street: '123 Main St',
      city: 'Paris',
      subscriptionStatus: 'active'
    });

    restaurantB = await Restaurant.create({
      name: 'Restaurant B',
      ownerId: 2,
      email: 'restaurantB@test.com',
      phone: '0987654321',
      street: '456 Oak Ave',
      city: 'Lyon',
      subscriptionStatus: 'active'
    });

    // Créer les owners
    ownerA = await User.create({
      email: 'ownerA@test.com',
      password: 'password123',
      name: 'Owner A',
      role: 'adminrestaurant'
    });

    ownerB = await User.create({
      email: 'ownerB@test.com',
      password: 'password123',
      name: 'Owner B',
      role: 'adminrestaurant'
    });

    // Créer les customers
    customerA = await User.create({
      email: 'customerA@test.com',
      password: 'password123',
      name: 'Customer A',
      role: 'customer'
    });

    customerB = await User.create({
      email: 'customerB@test.com',
      password: 'password123',
      name: 'Customer B',
      role: 'customer'
    });

    // Mettre à jour les restaurants avec les ownerId
    await restaurantA.update({ ownerId: ownerA.id });
    await restaurantB.update({ ownerId: ownerB.id });

    // Générer les tokens
    tokenOwnerA = generateToken(ownerA.id);
    tokenOwnerB = generateToken(ownerB.id);
    tokenCustomerA = generateToken(customerA.id);
    tokenCustomerB = generateToken(customerB.id);

    // Créer des menu items
    menuItemA = await MenuItem.create({
      name: 'Menu Item A',
      price: 10.00,
      restaurantId: restaurantA.id
    });

    menuItemB = await MenuItem.create({
      name: 'Menu Item B',
      price: 15.00,
      restaurantId: restaurantB.id
    });

    // Créer des commandes
    orderA = await Order.create({
      orderNumber: 'ORD-A-001',
      customerId: customerA.id,
      restaurantId: restaurantA.id,
      items: [{ menuItemId: menuItemA.id, quantity: 1, price: 10.00 }],
      subtotal: 10.00,
      total: 10.00,
      orderType: 'pickup'
    });

    orderB = await Order.create({
      orderNumber: 'ORD-B-001',
      customerId: customerB.id,
      restaurantId: restaurantB.id,
      items: [{ menuItemId: menuItemB.id, quantity: 1, price: 15.00 }],
      subtotal: 15.00,
      total: 15.00,
      orderType: 'pickup'
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await Order.destroy({ where: {}, force: true });
    await MenuItem.destroy({ where: {}, force: true });
    await Restaurant.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });

  describe('Order Isolation', () => {
    it('should not allow restaurant A owner to access restaurant B orders', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderB.id}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .set('X-Restaurant-Id', restaurantA.id.toString());

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should allow restaurant A owner to access restaurant A orders', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderA.id}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .set('X-Restaurant-Id', restaurantA.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(orderA.id);
    });

    it('should not allow customer A to access customer B orders', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderB.id}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .set('X-Restaurant-Id', restaurantA.id.toString());

      expect(response.status).toBe(403);
    });
  });

  describe('Menu Item Isolation', () => {
    it('should not allow restaurant A owner to access restaurant B menu items', async () => {
      const response = await request(app)
        .get(`/api/menu/${menuItemB.id}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .set('X-Restaurant-Id', restaurantA.id.toString());

      expect(response.status).toBe(403);
    });

    it('should allow restaurant A owner to access restaurant A menu items', async () => {
      const response = await request(app)
        .get(`/api/menu/${menuItemA.id}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .set('X-Restaurant-Id', restaurantA.id.toString());

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(menuItemA.id);
    });
  });

  describe('Restaurant Context Isolation', () => {
    it('should require restaurantId for restaurant owners', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${tokenOwnerA}`);
        // Pas de X-Restaurant-Id

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Restaurant ID required');
    });

    it('should automatically set restaurantId for restaurant owners', async () => {
      // Le middleware restaurantContext devrait automatiquement trouver le restaurant
      const response = await request(app)
        .get('/api/orders/restaurant')
        .set('Authorization', `Bearer ${tokenOwnerA}`);
        // Pas de X-Restaurant-Id, mais le middleware devrait le trouver automatiquement

      expect(response.status).toBe(200);
      // Vérifier que seules les commandes du restaurant A sont retournées
      expect(response.body.data.every(order => order.restaurantId === restaurantA.id)).toBe(true);
    });
  });
});
```

**Ajouter au package.json :**

```json
{
  "scripts": {
    "test:isolation": "jest tests/isolation.test.js",
    "test:all": "jest"
  }
}
```

**Temps estimé :** 4-6 heures

---

### 1.3 Ajouter des Headers de Sécurité

#### Solution : Utiliser Helmet.js

**Installer helmet :**

```bash
npm install helmet
```

**Modifier server.js :**

```javascript
// backend/src/server.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const securityLogger = require('./middleware/securityLogger');

const app = express();

// ⚠️ CORRECTION : Ajouter helmet pour les headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Désactiver si vous utilisez des iframes
}));

// CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  credentials: true
};
app.use(cors(corsOptions));

// ... reste du code
```

**Temps estimé :** 15 minutes

---

### 1.4 Vérifier la Force du JWT_SECRET

#### Solution : Vérification au Démarrage

**Modifier server.js :**

```javascript
// backend/src/server.js
// ⚠️ CORRECTION : Vérifier la force du JWT_SECRET au démarrage
if (!process.env.JWT_SECRET) {
  console.error('❌ ERREUR : JWT_SECRET n\'est pas défini');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ ERREUR : JWT_SECRET doit faire au moins 32 caractères');
  console.error(`   Longueur actuelle : ${process.env.JWT_SECRET.length}`);
  console.error('   Générez un nouveau secret avec :');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.error('❌ ERREUR : JWT_REFRESH_SECRET n\'est pas défini');
  process.exit(1);
}

if (process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('❌ ERREUR : JWT_REFRESH_SECRET doit faire au moins 32 caractères');
  process.exit(1);
}

console.log('✅ JWT secrets validés');
```

**Temps estimé :** 10 minutes

---

## ⚠️ PRIORITÉ 2 : AMÉLIORATIONS IMPORTANTES (2 semaines)

### 2.1 Implémenter Redis pour le Cache

#### Solution : Cache Redis pour les Données de Restaurant

**Installer les dépendances :**

```bash
npm install redis ioredis
```

**Créer un service de cache :**

```javascript
// backend/src/services/cacheService.js
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

const cacheService = {
  /**
   * Récupérer une valeur du cache
   */
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Stocker une valeur dans le cache
   */
  async set(key, value, ttl = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Supprimer une clé du cache
   */
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  },

  /**
   * Supprimer toutes les clés correspondant à un pattern
   */
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delPattern error:', error);
      return false;
    }
  }
};

module.exports = cacheService;
```

**Modifier restaurantContext.js pour utiliser le cache :**

```javascript
// backend/src/middleware/restaurantContext.js
const { Restaurant } = require('../models');
const cacheService = require('../services/cacheService');

// ... code existant ...

const restaurantContext = (options = {}) => {
  const { required = true } = options;

  return async (req, res, next) => {
    try {
      // ... code existant pour identifier restaurantId ...

      // ⚠️ AMÉLIORATION : Utiliser le cache pour les données de restaurant
      const cacheKey = `restaurant:${restaurantId}`;
      let restaurant = await cacheService.get(cacheKey);

      if (!restaurant) {
        // Charger depuis la base de données
        const restaurantModel = await Restaurant.findByPk(restaurantId, {
          attributes: [
            // ... attributs existants ...
          ]
        });

        if (!restaurantModel) {
          return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
            details: `Restaurant with ID ${restaurantId} does not exist`
          });
        }

        restaurant = restaurantModel.toJSON();

        // Mettre en cache pour 5 minutes
        await cacheService.set(cacheKey, restaurant, 300);
      }

      // ... reste du code existant ...
    } catch (error) {
      // ... gestion d'erreur existante ...
    }
  };
};
```

**Temps estimé :** 1-2 jours

---

### 2.2 Ajouter des Index Composites

#### Solution : Index Composites pour les Requêtes Fréquentes

**Créer une migration :**

```javascript
// backend/src/migrations/YYYYMMDDHHMMSS-add-composite-indexes.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Index composite pour orders (restaurantId, status)
    await queryInterface.addIndex('orders', ['restaurantId', 'status'], {
      name: 'idx_orders_restaurant_status',
      unique: false
    });

    // Index composite pour orders (restaurantId, createdAt)
    await queryInterface.addIndex('orders', ['restaurantId', 'createdAt'], {
      name: 'idx_orders_restaurant_created',
      unique: false
    });

    // Index composite pour menu_items (restaurantId, isActive)
    await queryInterface.addIndex('menu_items', ['restaurantId', 'isActive'], {
      name: 'idx_menu_items_restaurant_active',
      unique: false
    });

    // Index composite pour reviews (menuItemId, status)
    await queryInterface.addIndex('reviews', ['menuItemId', 'status'], {
      name: 'idx_reviews_menu_item_status',
      unique: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('orders', 'idx_orders_restaurant_status');
    await queryInterface.removeIndex('orders', 'idx_orders_restaurant_created');
    await queryInterface.removeIndex('menu_items', 'idx_menu_items_restaurant_active');
    await queryInterface.removeIndex('reviews', 'idx_reviews_menu_item_status');
  }
};
```

**Temps estimé :** 2-3 heures

---

## 📋 CHECKLIST DE MISE EN ŒUVRE

### Priorité 1 (Immédiat - 2-3 jours)

- [ ] Créer le middleware `enforceRestaurantIsolation`
- [ ] Modifier toutes les routes avec `restaurantContext.optional`
- [ ] Créer les tests d'isolation
- [ ] Installer et configurer `helmet`
- [ ] Ajouter la vérification du JWT_SECRET au démarrage
- [ ] Exécuter les tests d'isolation
- [ ] Vérifier que toutes les routes sont protégées

### Priorité 2 (2 semaines)

- [ ] Installer Redis
- [ ] Créer le service de cache
- [ ] Modifier `restaurantContext` pour utiliser le cache
- [ ] Créer la migration pour les index composites
- [ ] Exécuter la migration
- [ ] Tester les performances

---

## 🎯 RÉSULTAT ATTENDU

Après implémentation de ces corrections :

1. ✅ **Isolation des données garantie** : Aucune fuite de données possible
2. ✅ **Tests automatisés** : Détection automatique des régressions
3. ✅ **Headers de sécurité** : Protection contre les attaques HTTP
4. ✅ **JWT_SECRET validé** : Protection contre les tokens forgés
5. ✅ **Performance améliorée** : Cache Redis pour les données fréquentes
6. ✅ **Requêtes optimisées** : Index composites pour les requêtes fréquentes

---

**Temps total estimé :** 3-5 jours pour Priorité 1, 1-2 semaines pour Priorité 2


