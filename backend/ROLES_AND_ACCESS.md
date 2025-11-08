# 🔐 Rôles et Accès - CamCook SaaS

## 📊 Rôles Disponibles

### 1. 👤 `customer` (Client)
- **Description** : Utilisateur final qui commande dans un restaurant
- **Accès** :
  - App mobile (client) : Accueil, Menu, Commandes, Profil
  - **PAS** d'accès au dashboard admin
  - **PAS** d'accès au Super Admin Dashboard

### 2. 🏪 `restaurant` (Owner / Propriétaire de Restaurant)
- **Description** : Propriétaire d'un restaurant qui gère son établissement
- **Accès** :
  - **App mobile (admin)** : Dashboard admin du restaurant
    - Gestion du menu
    - Gestion des commandes
    - Gestion des accompagnements et boissons
    - Gestion des contacts/messages
    - Gestion des avis
    - Statistiques du restaurant
  - **Backend API** : Routes admin du restaurant (avec `authorize('restaurant', 'admin')`)
  - **PAS** d'accès au Super Admin Dashboard (nécessite rôle `admin`)

### 3. 🔑 `admin` (Super Admin)
- **Description** : Administrateur de la plateforme SaaS qui gère tous les restaurants
- **Accès** :
  - **Super Admin Dashboard** : `http://localhost:5000/admin`
    - Gestion de tous les restaurants
    - Statistiques globales
    - Gestion des abonnements
    - Création/modification/suppression de restaurants
  - **App mobile (admin)** : Dashboard admin (comme les owners)
  - **Backend API** : Toutes les routes (admin + superadmin)

---

## 🎯 Accès au Dashboard Admin

### Backend (Routes API)

Les routes admin des restaurants acceptent **les deux rôles** :

```javascript
// Exemple : Routes admin des restaurants
router.get('/restaurant', restaurantContext.required, protect, authorize('restaurant', 'admin'), ctrl.getRestaurantOrders);
router.post('/', restaurantContext.required, protect, authorize('restaurant', 'admin'), createMenuItem);
```

**Rôles autorisés** : `'restaurant'` **OU** `'admin'`

### Frontend (App Mobile)

**Avant la correction** :
```javascript
const isAdmin = isAuthenticated && user?.role === 'admin'; // ❌ Seul 'admin' pouvait accéder
```

**Après la correction** :
```javascript
// MULTI-TENANT : Les owners de restaurants (rôle 'restaurant') peuvent aussi accéder au dashboard admin
const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'restaurant'); // ✅
```

**Rôles autorisés** : `'restaurant'` **OU** `'admin'`

---

## 📋 Tableau Récapitulatif des Accès

| Rôle | App Mobile Client | App Mobile Admin | Super Admin Dashboard | Backend API Admin | Backend API SuperAdmin |
|------|------------------|-----------------|----------------------|-------------------|------------------------|
| `customer` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `restaurant` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔍 Vérification des Rôles

### Backend (Middleware `authorize`)

```javascript
// Autoriser les owners ET les admins
router.post('/', protect, authorize('restaurant', 'admin'), createMenuItem);

// Autoriser SEULEMENT les super admins
router.get('/superadmin/stats', protect, authorize('admin'), getGlobalStats);
```

### Frontend (App Mobile)

```javascript
// Vérifier si l'utilisateur peut accéder au dashboard admin
const isAdmin = user?.role === 'admin' || user?.role === 'restaurant';

// Afficher le dashboard admin si autorisé
{isAdmin ? <AdminNavigator /> : <RootStack />}
```

---

## 🎯 Cas d'Usage

### Cas 1 : Owner de Restaurant (rôle `restaurant`)

**Utilisateur** : `owner@camcook.fr` (rôle: `restaurant`)
- ✅ Peut se connecter à l'app mobile CamCook
- ✅ Peut accéder au dashboard admin dans l'app mobile
- ✅ Peut gérer le menu, les commandes, les accompagnements, etc.
- ❌ **NE PEUT PAS** accéder au Super Admin Dashboard (`http://localhost:5000/admin`)

### Cas 2 : Super Admin (rôle `admin`)

**Utilisateur** : `admin@camcook.fr` (rôle: `admin`)
- ✅ Peut se connecter à n'importe quelle app mobile
- ✅ Peut accéder au dashboard admin dans l'app mobile
- ✅ Peut accéder au Super Admin Dashboard (`http://localhost:5000/admin`)
- ✅ Peut gérer tous les restaurants de la plateforme

### Cas 3 : Client (rôle `customer`)

**Utilisateur** : `client@example.com` (rôle: `customer`)
- ✅ Peut se connecter à l'app mobile
- ✅ Peut voir le menu, passer des commandes, voir ses commandes
- ❌ **NE PEUT PAS** accéder au dashboard admin
- ❌ **NE PEUT PAS** accéder au Super Admin Dashboard

---

## ⚠️ IMPORTANT : Différence entre `restaurant` et `admin`

### Rôle `restaurant` (Owner)
- Gère **UN SEUL** restaurant (celui dont il est le propriétaire)
- Accès limité aux données de **SON** restaurant
- **PAS** d'accès au Super Admin Dashboard
- Utilisé pour les **owners de restaurants** dans un contexte White Label

### Rôle `admin` (Super Admin)
- Gère **TOUS** les restaurants de la plateforme
- Accès à toutes les données (tous les restaurants)
- Accès au **Super Admin Dashboard**
- Utilisé pour les **administrateurs de la plateforme SaaS**

---

## 🔧 Corrections Apportées

### 1. Frontend : AppNavigator.js

**Avant** :
```javascript
const isAdmin = isAuthenticated && user?.role === 'admin';
```

**Après** :
```javascript
// MULTI-TENANT : Les owners de restaurants (rôle 'restaurant') peuvent aussi accéder au dashboard admin
const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'restaurant');
```

### 2. Frontend : NotificationContext.js

**Avant** :
```javascript
const isAdmin = user?.role === 'admin';
```

**Après** :
```javascript
// MULTI-TENANT : Les owners (rôle 'restaurant') ont aussi accès aux notifications admin
const isAdmin = user?.role === 'admin' || user?.role === 'restaurant';
```

### 3. Backend : Routes Admin

**Déjà correct** :
```javascript
// Les routes admin acceptent déjà les deux rôles
router.post('/', protect, authorize('restaurant', 'admin'), createMenuItem);
```

---

## 📝 Résumé

**Les owners de restaurants (rôle `restaurant`) peuvent maintenant** :
- ✅ Accéder au dashboard admin dans l'app mobile
- ✅ Gérer leur restaurant (menu, commandes, accompagnements, etc.)
- ✅ Voir les notifications admin
- ❌ **NE PEUVENT PAS** accéder au Super Admin Dashboard (nécessite rôle `admin`)

**Les super admins (rôle `admin`) peuvent** :
- ✅ Accéder au dashboard admin dans l'app mobile
- ✅ Accéder au Super Admin Dashboard
- ✅ Gérer tous les restaurants de la plateforme

---

**Dernière mise à jour** : 2025-01-05


