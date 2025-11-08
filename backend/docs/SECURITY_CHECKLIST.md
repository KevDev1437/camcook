# 🔒 Checklist de Sécurité - Nouveaux Endpoints

**Version :** 1.0  
**Date :** 2025-01-XX

Cette checklist doit être suivie pour **TOUS** les nouveaux endpoints créés dans l'API CamCook SaaS Platform.

---

## 📋 Avant de créer un endpoint

Avant de commencer à coder, définir clairement :

- [ ] **Qui peut accéder** : customer, adminrestaurant, superadmin, ou public
- [ ] **Si restaurantContext est nécessaire** : required, optional, ou none
- [ ] **Quelles données sont sensibles** : passwords, tokens, données personnelles
- [ ] **Le schéma de validation Joi** : quels champs sont requis, leurs formats, limites

---

## 🛠️ Lors de la création

### 1. Route (`backend/src/routes/*.routes.js`)

- [ ] Ajouter `protect` si authentification requise
- [ ] Ajouter `authorize('role1', 'role2')` pour les rôles autorisés
- [ ] Ajouter `restaurantContext.required` ou `.optional` si nécessaire
- [ ] Ajouter `validate(schemas.xxx)` pour la validation Joi
- [ ] Ajouter les rate limiters si nécessaire (`authLimiter`, `paymentLimiter`, `uploadLimiter`)

#### ✅ Exemple de route sécurisée :

```javascript
const { validate, schemas } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');
const restaurantContext = require('../middleware/restaurantContext');
const { authLimiter } = require('../middleware/rateLimiter');

router.post(
  '/orders',
  restaurantContext.required,        // Restaurant requis pour isolation
  protect,                           // Auth requise
  validate(schemas.createOrder),     // Validation Joi
  orderController.createOrder
);
```

#### ❌ Exemple de route NON sécurisée :

```javascript
// ❌ PAS DE PROTECTION
router.post('/orders', orderController.createOrder);

// ❌ PAS DE VALIDATION
router.post('/orders', protect, orderController.createOrder);

// ❌ PAS DE RESTAURANT CONTEXT (fuite de données)
router.get('/orders', protect, orderController.getAllOrders);
```

---

### 2. Controller (`backend/src/controllers/*.controller.js`)

- [ ] Valider tous les paramètres (parseInt, isNaN pour les IDs)
- [ ] Filtrer par `restaurantId` si données multi-tenant
- [ ] Vérifier les permissions (owner vs admin)
- [ ] Utiliser `logger.error()` au lieu de `console.error()`
- [ ] Ne pas retourner de données sensibles (passwords, tokens)
- [ ] Utiliser `try/catch` et passer les erreurs à `next()` pour `errorHandler`
- [ ] Vérifier que l'utilisateur a accès à la ressource demandée

#### ✅ Exemple de controller sécurisé :

```javascript
const logger = require('../utils/logger');
const { Order } = require('../models');

exports.createOrder = async (req, res, next) => {
  try {
    // Validation des IDs
    const customerId = req.user?.id;
    if (!customerId || isNaN(parseInt(customerId))) {
      const error = new Error('Invalid customer ID');
      error.statusCode = 400;
      throw error;
    }

    // Vérifier que restaurantId est présent (chargé par restaurantContext)
    if (!req.restaurantId) {
      const error = new Error('Restaurant context not loaded');
      error.statusCode = 400;
      throw error;
    }

    // Validation des données
    const { items, total } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Items are required');
      error.statusCode = 400;
      throw error;
    }

    // Créer la commande avec restaurantId (isolation multi-tenant)
    const order = await Order.create({
      customerId,
      restaurantId: req.restaurantId, // ✅ Utiliser req.restaurantId
      items,
      total,
      status: 'pending'
    });

    res.status(201).json({ 
      success: true, 
      data: order 
    });
  } catch (error) {
    // ✅ Utiliser logger.error avec contexte
    logger.error('Error creating order', error, { 
      userId: req.user?.id, 
      restaurantId: req.restaurantId 
    });
    // ✅ Passer à errorHandler
    next(error);
  }
};
```

#### ❌ Exemple de controller NON sécurisé :

```javascript
// ❌ PAS DE VALIDATION
exports.createOrder = async (req, res) => {
  const order = await Order.create(req.body);
  res.json(order);
};

// ❌ PAS DE FILTRAGE PAR RESTAURANT (fuite de données)
exports.getAllOrders = async (req, res) => {
  const orders = await Order.findAll(); // Retourne TOUS les restaurants
  res.json(orders);
};

// ❌ PAS DE VÉRIFICATION DES PERMISSIONS
exports.updateOrder = async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  await order.update(req.body); // N'importe qui peut modifier n'importe quelle commande
  res.json(order);
};

// ❌ LOGS NON SANITIZÉS
exports.createOrder = async (req, res) => {
  try {
    // ...
  } catch (error) {
    console.error('Error:', error, req.body); // Peut logger des passwords/tokens
    res.status(500).json({ error: error.message }); // Fuite d'infos en production
  }
};
```

---

### 3. Validation Joi (`backend/src/middleware/validation.js`)

- [ ] Créer un schéma de validation dans `validation.js`
- [ ] Valider tous les champs obligatoires
- [ ] Limiter la longueur des strings
- [ ] Valider les formats (email, phone, URL)
- [ ] Valider les types (number, string, boolean)
- [ ] Ajouter des messages d'erreur personnalisés en français
- [ ] Utiliser `.trim()` pour nettoyer les strings
- [ ] Utiliser `.stripUnknown: true` pour supprimer les champs non définis

#### ✅ Exemple de schéma Joi :

```javascript
const schemas = {
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.number().integer().positive().required()
          .messages({
            'number.base': 'L\'ID du plat doit être un nombre',
            'number.positive': 'L\'ID du plat doit être positif',
            'any.required': 'L\'ID du plat est requis'
          }),
        quantity: Joi.number().integer().min(1).max(99).required()
          .messages({
            'number.min': 'La quantité doit être au moins 1',
            'number.max': 'La quantité ne peut pas dépasser 99'
          }),
        price: Joi.number().positive().precision(2).required()
      })
    ).min(1).max(50).required()
      .messages({
        'array.min': 'Au moins un article est requis',
        'array.max': 'Maximum 50 articles par commande'
      }),
    
    total: Joi.number().positive().precision(2).required(),
    deliveryAddress: Joi.string().min(5).max(500).trim().required()
  })
};
```

#### ❌ Exemple de schéma NON sécurisé :

```javascript
// ❌ PAS DE LIMITES
createOrder: Joi.object({
  items: Joi.array().items(Joi.object()).required() // Pas de limite de quantité
});

// ❌ PAS DE VALIDATION DE FORMAT
createUser: Joi.object({
  email: Joi.string().required() // Pas de validation email
});

// ❌ PAS DE MESSAGES D'ERREUR
createOrder: Joi.object({
  total: Joi.number().required() // Message d'erreur générique
});
```

---

## ✅ Après la création

### Tests de sécurité

- [ ] **Tester avec différents rôles** : customer, adminrestaurant, superadmin
- [ ] **Tester l'isolation multi-tenant** : vérifier qu'un restaurant ne peut pas accéder aux données d'un autre
- [ ] **Tester les permissions** : vérifier qu'un customer ne peut pas modifier les données d'un autre
- [ ] **Tester la validation** : envoyer des données invalides et vérifier les erreurs
- [ ] **Vérifier les logs** : s'assurer qu'aucune donnée sensible n'est loggée
- [ ] **Tester les erreurs** : vérifier que les messages d'erreur ne révèlent pas d'informations sensibles

### Documentation

- [ ] **Documenter l'endpoint** dans `backend/docs/API_ROUTES.md`
- [ ] **Ajouter des commentaires** dans le code expliquant les vérifications de sécurité
- [ ] **Ajouter des tests unitaires** si l'endpoint est critique

---

## ⚠️ Points d'attention spécifiques

### Routes multi-tenant

#### ✅ CORRECT :

```javascript
// Filtrer par restaurantId
const orders = await Order.findAll({
  where: { restaurantId: req.restaurantId }
});

// Vérifier l'appartenance avant modification
const order = await Order.findOne({
  where: { 
    id: orderId,
    restaurantId: req.restaurantId 
  }
});
if (!order) {
  throw new Error('Order not found or access denied');
}
```

#### ❌ INCORRECT :

```javascript
// ❌ Retourne TOUS les restaurants
const orders = await Order.findAll();

// ❌ Pas de vérification d'appartenance
const order = await Order.findByPk(orderId);
await order.update(req.body); // Peut modifier n'importe quelle commande
```

---

### Vérification des permissions

#### ✅ CORRECT :

```javascript
// Vérifier que l'utilisateur est le propriétaire
if (req.user.role === 'adminrestaurant' && order.restaurantId !== req.restaurantId) {
  const error = new Error('Access denied');
  error.statusCode = 403;
  throw error;
}

// Vérifier que l'utilisateur est le propriétaire du restaurant
const restaurant = await Restaurant.findByPk(req.restaurantId);
if (restaurant.ownerId !== req.user.id) {
  const error = new Error('Access denied');
  error.statusCode = 403;
  throw error;
}
```

#### ❌ INCORRECT :

```javascript
// ❌ Pas de vérification → fuite de données
const orders = await Order.findAll({
  where: { customerId: req.user.id }
}); // Un customer peut voir toutes ses commandes, même d'autres restaurants

// ❌ Pas de vérification du propriétaire
const restaurant = await Restaurant.findByPk(req.params.id);
await restaurant.update(req.body); // N'importe qui peut modifier n'importe quel restaurant
```

---

### Gestion des erreurs

#### ✅ CORRECT :

```javascript
try {
  // ...
} catch (error) {
  // ✅ Logger avec logger.error (sanitize automatique)
  logger.error('Error creating order', error, { 
    userId: req.user?.id, 
    restaurantId: req.restaurantId 
  });
  // ✅ Passer à errorHandler (messages génériques en production)
  next(error);
}
```

#### ❌ INCORRECT :

```javascript
try {
  // ...
} catch (error) {
  // ❌ Logs pas sanitizés
  console.error('Error:', error, req.body); // Peut logger des passwords/tokens
  
  // ❌ Fuite d'informations en production
  res.status(500).json({ 
    error: error.message,  // Révèle des détails techniques
    stack: error.stack     // Révèle la structure du code
  });
}
```

---

### Exclusion des données sensibles

#### ✅ CORRECT :

```javascript
// Exclure le password des réponses
const users = await User.findAll({
  attributes: { exclude: ['password'] }
});

// Ne retourner que les champs nécessaires
res.json({
  success: true,
  data: {
    id: user.id,
    name: user.name,
    email: user.email
    // password n'est pas retourné
  }
});
```

#### ❌ INCORRECT :

```javascript
// ❌ Retourne le password
const user = await User.findByPk(userId);
res.json(user); // Contient le password hashé

// ❌ Retourne trop de données
res.json({
  success: true,
  data: user // Contient password, tokens, etc.
});
```

---

## 📚 Exemples de routes sécurisées

### Route publique

```javascript
router.get('/restaurants/list', 
  restaurantContext.optional,  // Optionnel mais utilisé pour filtrer si disponible
  restaurantController.listRestaurants
);
```

### Route authentifiée simple

```javascript
router.get('/orders/my-orders', 
  restaurantContext.required,  // Requis pour isolation multi-tenant
  protect,                     // Auth requise
  orderController.myOrders
);
```

### Route restaurant owner

```javascript
router.post('/menus', 
  restaurantContext.required,                    // Restaurant requis
  protect,                                       // Auth requise
  authorize('adminrestaurant', 'superadmin'),    // Rôles autorisés
  uploadLimiter,                                 // Rate limiting
  validateImageUpload,                           // Validation uploads
  validate(schemas.createMenuItem),              // Validation Joi
  menuController.createMenuItem
);
```

### Route super admin

```javascript
router.get('/superadmin/stats', 
  protect,                    // Auth requise
  authorize('superadmin'),    // Superadmin uniquement
  superadminController.getGlobalStats
);
```

### Route avec validation Joi

```javascript
router.post('/orders', 
  restaurantContext.required,
  protect,
  validate(schemas.createOrder),  // Validation automatique
  orderController.createOrder
);
```

---

## 🔍 Checklist rapide

Avant de merger un PR avec un nouveau endpoint, vérifier :

- [ ] Route : `protect`, `authorize`, `restaurantContext`, `validate`
- [ ] Controller : validation IDs, filtrage `restaurantId`, vérification permissions, `logger.error`, `next(error)`
- [ ] Validation : schéma Joi créé, tous les champs validés, messages d'erreur en français
- [ ] Tests : différents rôles, isolation multi-tenant, permissions, validation
- [ ] Documentation : endpoint documenté dans `API_ROUTES.md`
- [ ] Logs : aucune donnée sensible loggée

---

## 📞 Support

En cas de doute sur la sécurité d'un endpoint, consulter :

1. **Audit de sécurité** : `AUDIT_SECURITE.md`
2. **Documentation des routes** : `API_ROUTES.md`
3. **Code existant** : regarder les endpoints similaires déjà implémentés

---

**Développé pour CamCook SaaS Platform**  
**Dernière mise à jour :** 2025-01-XX


