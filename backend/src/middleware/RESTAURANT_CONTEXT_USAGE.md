# 🏪 Middleware Restaurant Context - Guide d'utilisation

Le middleware `restaurantContext` identifie automatiquement le restaurant dans chaque requête pour le support SaaS White Label.

## 📋 Fonctionnalités

- ✅ Identification automatique du restaurant via plusieurs méthodes
- ✅ Chargement des données complètes du restaurant
- ✅ Vérification de l'état actif du restaurant
- ✅ Vérification de la validité de l'abonnement SaaS
- ✅ Support des routes publiques (restaurantId optionnel)
- ✅ Logging pour le debug

## 🔍 Identification du Restaurant

Le middleware cherche le `restaurantId` dans cet ordre de priorité :

1. **Header HTTP** : `X-Restaurant-Id: 3`
2. **Query Parameter** : `?restaurantId=3`
3. **Variable d'environnement** : `RESTAURANT_ID=3` (pour White Label)
4. **Paramètre URL** : `/:restaurantId/` (pour les routes avec paramètre)

## 🚀 Utilisation de base

### Import du middleware

```javascript
const restaurantContext = require('../middleware/restaurantContext');
```

### Utilisation requise (restaurantId obligatoire)

```javascript
const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const menuController = require('../controllers/menu.controller');

// Toutes les routes nécessitent un restaurantId
router.get('/menu', restaurantContext.required, menuController.getMenu);
router.post('/menu', restaurantContext.required, menuController.createMenuItem);
```

**Ou avec options** :

```javascript
router.get('/menu', restaurantContext({ required: true }), menuController.getMenu);
```

### Utilisation optionnelle (restaurantId non requis)

```javascript
// Route publique - restaurantId optionnel
router.get('/list', restaurantContext.optional, restaurantController.listRestaurants);

// Ou avec options
router.get('/list', restaurantContext({ required: false }), restaurantController.listRestaurants);
```

## 📝 Exemples d'utilisation dans les routes

### Exemple 1 : Routes de menu (restaurantId requis)

```javascript
// backend/src/routes/menu.routes.js
const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const { protect, authorize } = require('../middleware/auth');
const menuController = require('../controllers/menu.controller');

// Routes publiques (lecture seule)
router.get('/', restaurantContext.required, menuController.getMenuItems);
router.get('/:id', restaurantContext.required, menuController.getMenuItemById);

// Routes protégées (restaurant owner ou admin)
router.post('/', 
  restaurantContext.required,
  protect,
  authorize('restaurant', 'admin'),
  menuController.createMenuItem
);

router.put('/:id',
  restaurantContext.required,
  protect,
  authorize('restaurant', 'admin'),
  menuController.updateMenuItem
);

module.exports = router;
```

### Exemple 2 : Routes de commandes (restaurantId requis)

```javascript
// backend/src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const { protect } = require('../middleware/auth');
const orderController = require('../controllers/order.controller');

// Créer une commande (client)
router.post('/',
  restaurantContext.required,
  protect,
  orderController.createOrder
);

// Lister les commandes du restaurant (propriétaire)
router.get('/',
  restaurantContext.required,
  protect,
  authorize('restaurant', 'admin'),
  orderController.getRestaurantOrders
);

module.exports = router;
```

### Exemple 3 : Routes publiques (restaurantId optionnel)

```javascript
// backend/src/routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const restaurantController = require('../controllers/restaurant.controller');

// Liste publique de tous les restaurants (restaurantId non requis)
router.get('/list', restaurantContext.optional, restaurantController.listRestaurants);

// Détails d'un restaurant spécifique (restaurantId requis)
router.get('/info', restaurantContext.required, restaurantController.getRestaurantInfo);

module.exports = router;
```

### Exemple 4 : Routes avec paramètre URL

```javascript
// backend/src/routes/restaurant.routes.js
const express = require('express');
const router = express.Router();
const restaurantContext = require('../middleware/restaurantContext');
const menuController = require('../controllers/menu.controller');

// Le restaurantId peut venir du paramètre URL
router.get('/:restaurantId/menu', 
  restaurantContext.required, // Récupère restaurantId depuis req.params.restaurantId
  menuController.getMenu
);
```

## 💻 Utilisation dans les contrôleurs

Une fois le middleware appliqué, le restaurant est disponible dans `req.restaurant` et `req.restaurantId` :

```javascript
// backend/src/controllers/menu.controller.js
exports.getMenuItems = async (req, res) => {
  try {
    // req.restaurant contient toutes les données du restaurant
    const restaurantId = req.restaurantId; // Raccourci pratique
    const restaurant = req.restaurant; // Objet complet du restaurant

    console.log(`Chargement du menu pour: ${restaurant.name} (ID: ${restaurantId})`);
    console.log(`Slug: ${restaurant.slug}`);
    console.log(`Settings:`, restaurant.settings);

    // Utiliser restaurantId dans les requêtes
    const menuItems = await MenuItem.findAll({
      where: { restaurantId: req.restaurantId }
    });

    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug
      },
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

## 🔧 Configuration White Label

Pour les apps White Label, configurez la variable d'environnement :

```env
# .env
RESTAURANT_ID=3
```

Ainsi, toutes les requêtes utiliseront automatiquement le restaurant ID 3, même sans header ou query parameter.

## 📤 Format des réponses d'erreur

### Restaurant ID manquant (400)

```json
{
  "success": false,
  "message": "Restaurant ID required",
  "details": "Provide restaurantId via: X-Restaurant-Id header, ?restaurantId query param, RESTAURANT_ID env variable, or /:restaurantId URL param"
}
```

### Restaurant introuvable (404)

```json
{
  "success": false,
  "message": "Restaurant not found",
  "details": "Restaurant with ID 3 does not exist"
}
```

### Restaurant inactif (403)

```json
{
  "success": false,
  "message": "Restaurant is inactive",
  "details": "Restaurant \"CamCook\" (ID: 3) is currently inactive"
}
```

### Abonnement expiré ou invalide (403)

```json
{
  "success": false,
  "message": "Subscription expired or invalid",
  "details": "Subscription expired on 2025-01-01T00:00:00.000Z",
  "restaurantId": 3,
  "restaurantName": "CamCook"
}
```

## 🎯 Cas d'usage typiques

### 1. App White Label (restaurantId en dur)

```javascript
// .env de l'app White Label
RESTAURANT_ID=5

// Toutes les routes utilisent automatiquement restaurantId=5
router.get('/menu', restaurantContext.required, menuController.getMenu);
```

### 2. API Multi-tenant (restaurantId dynamique)

```javascript
// Le restaurantId vient du header ou query param
router.get('/menu', restaurantContext.required, menuController.getMenu);

// Client envoie: GET /api/menu?restaurantId=3
// Ou: GET /api/menu avec header X-Restaurant-Id: 3
```

### 3. Routes publiques (liste des restaurants)

```javascript
// Pas besoin de restaurantId pour lister tous les restaurants
router.get('/list', restaurantContext.optional, restaurantController.listRestaurants);
```

## 🔒 Sécurité

- ✅ Le middleware vérifie que le restaurant existe
- ✅ Le middleware vérifie que le restaurant est actif (`isActive = true`)
- ✅ Le middleware vérifie que l'abonnement est valide (`subscriptionStatus = 'active'` ou `'trial'`)
- ✅ Le middleware vérifie que l'abonnement n'est pas expiré (`subscriptionEndDate`)

## 📊 Logging

En mode développement, le middleware log les informations suivantes :

```
[RESTAURANT_CONTEXT] Identification du restaurant ID: 3 pour GET /api/menu
[RESTAURANT_CONTEXT] Restaurant chargé: CamCook (ID: 3, Slug: camcook, Status: active)
```

## ⚠️ Notes importantes

1. **Ordre des middlewares** : Appliquez `restaurantContext` avant les autres middlewares qui en ont besoin :
   ```javascript
   router.post('/menu',
     restaurantContext.required, // 1. Identifier le restaurant
     protect,                    // 2. Vérifier l'authentification
     authorize('admin'),         // 3. Vérifier les permissions
     menuController.create       // 4. Exécuter le contrôleur
   );
   ```

2. **Performance** : Le middleware fait une requête à la base de données à chaque appel. Pour optimiser, vous pouvez ajouter un cache Redis si nécessaire.

3. **White Label** : Pour les apps White Label, utilisez toujours `RESTAURANT_ID` dans `.env` pour éviter de passer le restaurantId dans chaque requête.

## 🐛 Dépannage

### Erreur : "Restaurant ID required"

**Solution** : Vérifiez que vous passez le restaurantId via une des méthodes supportées :
- Header : `X-Restaurant-Id: 3`
- Query : `?restaurantId=3`
- Variable d'environnement : `RESTAURANT_ID=3`
- Paramètre URL : `/:restaurantId/`

### Erreur : "Restaurant not found"

**Solution** : Vérifiez que le restaurant existe dans la base de données :
```sql
SELECT * FROM restaurants WHERE id = 3;
```

### Erreur : "Restaurant is inactive"

**Solution** : Activez le restaurant :
```sql
UPDATE restaurants SET isActive = true WHERE id = 3;
```

### Erreur : "Subscription expired or invalid"

**Solution** : Vérifiez le statut de l'abonnement :
```sql
SELECT subscriptionStatus, subscriptionEndDate FROM restaurants WHERE id = 3;
```

Pour activer l'abonnement :
```sql
UPDATE restaurants 
SET subscriptionStatus = 'active', 
    subscriptionEndDate = DATE_ADD(NOW(), INTERVAL 1 YEAR)
WHERE id = 3;
```

