# 🔄 Analyse Complète - Transformation en SaaS Multi-Restaurants

## 📋 Vue d'Ensemble

Ce document analyse l'architecture actuelle de **CamCook** pour planifier la transformation en **SaaS multi-restaurants**. L'application actuelle est conçue pour un seul restaurant (CamCook) et doit être transformée pour supporter plusieurs restaurants avec isolation des données.

---

## 1. ARCHITECTURE ACTUELLE

### 1.1 Structure de la Base de Données

**Base de données** : MySQL avec Sequelize ORM

#### Modèles Principaux (11 modèles)

| Modèle | Description | Clé Multi-Restaurant |
|--------|-------------|---------------------|
| `User` | Utilisateurs (customer, restaurant, admin) | ✅ Supporte déjà `role: 'restaurant'` |
| `Restaurant` | Restaurants | ✅ **Déjà multi-restaurant** (`ownerId`) |
| `MenuItem` | Plats du menu | ✅ **Déjà lié** via `restaurantId` |
| `Order` | Commandes | ✅ **Déjà lié** via `restaurantId` |
| `Review` | Avis sur les plats | ✅ **Déjà lié** via `menuItemId` → `restaurantId` |
| `Question` | Questions sur les plats | ✅ **Déjà lié** via `menuItemId` → `restaurantId` |
| `Address` | Adresses des utilisateurs | ✅ Lié à `userId` (pas spécifique restaurant) |
| `ContactMessage` | Messages de contact | ❌ **Pas de `restaurantId`** (global) |
| `SiteInfo` | Informations du site (footer) | ❌ **Pas de `restaurantId`** (global) |
| `Accompaniment` | Accompagnements | ❌ **Pas de `restaurantId`** (global) |
| `Drink` | Boissons | ❌ **Pas de `restaurantId`** (global) |

**Conclusion** : La structure de base de données **supporte déjà** plusieurs restaurants, mais certains modèles sont globalisés.

---

### 1.2 Données Hard-Codées (CRITIQUE)

#### Backend - Données Hard-Codées

**Fichiers avec hard-coding "CamCook"** :

1. **`backend/src/controllers/restaurant.controller.js`**
   - `resolveCamcook()` : Recherche par nom "CamCook" ou variable d'environnement `CAMCOOK_RESTAURANT_ID`
   - `getCamCookRestaurant()` : Endpoint spécifique à CamCook
   - `getCamCookMenu()` : Menu spécifique à CamCook

2. **`backend/src/controllers/order.controller.js`**
   - `resolveRestaurantId()` : Recherche par nom "CamCook"

3. **`backend/src/controllers/payment.controller.js`**
   - Description Stripe : `"Commande CamCook - ..."`

4. **`backend/src/routes/restaurant.routes.js`**
   - Routes limitées à CamCook uniquement

5. **`backend/scripts/seed-db.js`**
   - Création d'un seul restaurant "CamCook" par défaut

#### Frontend - Données Hard-Codées

**Fichiers avec hard-coding** :

1. **`mobile-expo/src/screens/HomeScreen.js`**
   - `CAMCOOK_RESTAURANT_ID = 3` (hard-codé)
   - Titre "CamCook" dans Hero

2. **`mobile-expo/src/services/restaurantService.js`**
   - Commentaires "Get CamCook restaurant info"
   - Endpoints spécifiques (`/restaurants/info`, `/restaurants/menu`)

3. **`mobile-expo/src/components/Header.js`**
   - Logo texte "CamCook" hard-codé

4. **`mobile-expo/src/components/Footer.js`**
   - Email "contact@camcook.com"
   - URL "https://camcook.com"
   - Copyright "© 2025 CamCook"

5. **`mobile-expo/src/screens/PaymentScreen.js`**
   - `merchantDisplayName: 'CamCook'` (Stripe)

6. **`mobile-expo/src/components/Hero.js`**
   - Titre par défaut "CamCook"

**Conclusion** : **29 occurrences** de "CamCook" hard-codées à remplacer par des données dynamiques.

---

### 1.3 Système d'Authentification

**Authentification** : JWT (JSON Web Tokens)

#### Structure Actuelle
- **Middleware** : `backend/src/middleware/auth.js`
  - `protect` : Vérifie le token JWT
  - `authorize` : Vérifie les rôles (customer, restaurant, admin)

#### Rôles Utilisateurs
- `customer` : Clients (par défaut)
- `restaurant` : Propriétaires de restaurants (déjà implémenté mais peu utilisé)
- `admin` : Administrateurs système

#### Token JWT
- **Expiration** : 1 heure (access token)
- **Refresh Token** : Implémenté (`generateRefreshToken.js`)
- **Stockage** : AsyncStorage (frontend)

**Conclusion** : L'authentification **supporte déjà** les rôles multi-restaurants, mais il faut ajouter la gestion du `restaurantId` dans le contexte utilisateur.

---

## 2. BACKEND/API

### 2.1 Framework

**Backend** : Node.js + Express.js 5.1.0

- **Version Node.js** : >= 20.17.0
- **ORM** : Sequelize 6.37.7
- **Base de données** : MySQL

### 2.2 Stockage des Données Restaurant

**Modèle Restaurant** (`backend/src/models/Restaurant.js`) :

```javascript
{
  ownerId: INTEGER,          // Propriétaire du restaurant
  name: STRING(150),
  description: TEXT,
  logo: STRING(255),
  coverImage: STRING(255),
  cuisine: JSON,              // Types de cuisine
  street, city, postalCode,   // Adresse
  latitude, longitude,        // Coordonnées GPS
  phone, email,
  openingHours: JSON,        // Horaires d'ouverture
  hasPickup: BOOLEAN,
  hasDelivery: BOOLEAN,
  deliveryFee: DECIMAL,
  minimumOrder: DECIMAL,
  estimatedTime: INTEGER,
  ratingAverage: DECIMAL,
  ratingCount: INTEGER,
  isActive: BOOLEAN,
  isVerified: BOOLEAN
}
```

**Conclusion** : Structure complète, mais manque :
- `subdomain` ou `slug` pour l'URL personnalisée
- `settings` JSON pour les configurations spécifiques
- `subscription` pour les plans SaaS

### 2.3 Type d'API

**API REST** (pas GraphQL)

#### Routes Actuelles

| Route | Description | Multi-Restaurant |
|-------|-------------|------------------|
| `/api/auth/*` | Authentification | ✅ OK (universel) |
| `/api/users/*` | Gestion utilisateurs | ✅ OK (universel) |
| `/api/restaurants/info` | Info CamCook | ❌ **Hard-codé** |
| `/api/restaurants/menu` | Menu CamCook | ❌ **Hard-codé** |
| `/api/menus/*` | Gestion menu | ⚠️ Partiel (support `restaurantId` mais pas utilisé) |
| `/api/orders/*` | Commandes | ⚠️ Support `restaurantId` mais résolution CamCook |
| `/api/reviews/*` | Avis | ✅ OK (via `menuItemId`) |
| `/api/questions/*` | Questions | ✅ OK (via `menuItemId`) |
| `/api/admin/*` | Dashboard admin | ⚠️ Pas de filtrage par restaurant |
| `/api/accompaniments/*` | Accompagnements | ❌ **Global** (pas de `restaurantId`) |
| `/api/drinks/*` | Boissons | ❌ **Global** (pas de `restaurantId`) |
| `/api/site-info/*` | Info site | ❌ **Global** (pas de `restaurantId`) |
| `/api/contact-messages/*` | Messages contact | ❌ **Global** (pas de `restaurantId`) |

**Conclusion** : L'API **supporte partiellement** plusieurs restaurants, mais beaucoup d'endpoints sont hard-codés ou globalisés.

---

## 3. FRONTEND

### 3.1 Technologie

**Frontend** : React Native avec Expo ~54.0.20

- **React** : 19.1.0
- **React Native** : 0.81.5
- **Navigation** : React Navigation 7.x
- **HTTP Client** : Axios
- **Storage** : AsyncStorage

### 3.2 Gestion des Données Restaurant

**Actuellement** :
- **Hard-codé** : Restaurant ID = 3 (CamCook)
- **Services** : `restaurantService.js` avec endpoints fixes
- **Context** : Pas de contexte restaurant (seulement Auth, Cart, Notifications)

**Écrans Principaux** :
- `HomeScreen` : Affiche le menu du restaurant (hard-codé)
- `MenuItemDetailScreen` : Détails d'un plat
- `CartScreen` : Panier (gestion multi-restaurant à vérifier)
- `OrdersScreen` : Historique des commandes
- `RestaurantDetailScreen` : Détails restaurant (non utilisé actuellement)

**Conclusion** : Le frontend est **complètement mono-restaurant**. Il faut ajouter :
- Sélection de restaurant au démarrage
- Context API pour le restaurant actuel
- Routes dynamiques par restaurant

---

## 4. FONCTIONNALITÉS ACTUELLES

### 4.1 Fonctionnalités Principales

#### Client (Customer)
- ✅ Parcourir le menu
- ✅ Consulter les plats (détails, images, prix)
- ✅ Ajouter au panier (avec options : accompagnements, boissons)
- ✅ Passer commande (livraison/retrait)
- ✅ Paiement Stripe (carte, Apple Pay, Google Pay)
- ✅ Suivi des commandes (statuts en temps réel)
- ✅ Historique des commandes
- ✅ Profil utilisateur (avatar, adresses)
- ✅ Avis et notes sur les plats
- ✅ Questions aux restaurateurs
- ✅ Notifications en temps réel

#### Restaurant Owner (Admin)
- ✅ Dashboard admin (KPIs, graphiques)
- ✅ Gestion des commandes (liste, statuts, filtres)
- ✅ Gestion du menu (CRUD plats)
- ✅ Gestion des accompagnements et boissons
- ✅ Gestion des avis (modération)
- ✅ Gestion des questions (réponses)
- ✅ Gestion des contacts/messages
- ✅ Gestion des paiements
- ✅ Gestion des utilisateurs
- ✅ Profil restaurant (informations, images)

#### Admin Système
- ✅ Toutes les fonctionnalités restaurant
- ✅ Gestion globale (tous les restaurants)

### 4.2 Données Spécifiques au Restaurant

**Données déjà isolées par restaurant** :
- ✅ Menu (plats)
- ✅ Commandes
- ✅ Avis (via menuItemId)
- ✅ Questions (via menuItemId)
- ✅ Informations restaurant (nom, adresse, horaires, etc.)

**Données globalisées (à isoler)** :
- ❌ Accompagnements (global)
- ❌ Boissons (global)
- ❌ SiteInfo (footer - global)
- ❌ ContactMessages (pas de restaurantId)

**Données partagées (OK)** :
- ✅ Utilisateurs (clients peuvent commander à plusieurs restaurants)
- ✅ Adresses (liées à l'utilisateur, pas au restaurant)

---

## 5. HÉBERGEMENT

### 5.1 Hébergement Actuel

**Non spécifié** dans le code (développement local)

- **Backend** : `localhost:5000` (dev) ou `192.168.x.x:5000` (réseau local)
- **Base de données** : MySQL local (port 3306)
- **Frontend** : Expo Go (dev) ou build standalone

### 5.2 Base de Données

**MySQL** via Sequelize

- **Pool de connexions** : max 5, min 0
- **Synchronisation** : `alter: true` (modifie les tables sans perdre de données)

**Variables d'environnement** :
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=camcook
DB_USER=root
DB_PASSWORD=...
```

---

## 6. POINTS CRITIQUES POUR LA TRANSFORMATION SAAS

### 6.1 Isolation des Données

#### Problèmes Identifiés

1. **Endpoints Hard-Codés**
   - `/api/restaurants/info` → CamCook uniquement
   - `/api/restaurants/menu` → CamCook uniquement
   - Résolution restaurant par nom "CamCook"

2. **Modèles Globalisés**
   - `Accompaniment` : Pas de `restaurantId`
   - `Drink` : Pas de `restaurantId`
   - `SiteInfo` : Pas de `restaurantId` (peut rester global ou devenir par restaurant)
   - `ContactMessage` : Pas de `restaurantId`

3. **Admin Dashboard**
   - Pas de filtrage par restaurant (voit tout)
   - Les owners restaurant ne voient que leurs données (via `ownerId`)

4. **Frontend Mono-Restaurant**
   - Aucune sélection de restaurant
   - Restaurant ID hard-codé
   - Pas de contexte restaurant

### 6.2 Authentification Multi-Restaurant

#### À Implémenter

1. **Contexte Restaurant dans le Token**
   - Ajouter `restaurantId` dans le JWT (pour les owners)
   - Middleware pour vérifier l'accès au restaurant

2. **Sélection de Restaurant**
   - Frontend : Sélectionner le restaurant au démarrage
   - Backend : Identifier le restaurant via :
     - Subdomain (`restaurant1.camcook.fr`)
     - Slug dans l'URL (`/restaurant/restaurant1`)
     - Paramètre `restaurantId` dans les requêtes
     - Header `X-Restaurant-Id`

3. **Isolation des Données**
   - Middleware pour filtrer automatiquement par `restaurantId`
   - Vérification des permissions (owner vs admin)

### 6.3 Fonctionnalités SaaS

#### À Ajouter

1. **Gestion des Abonnements**
   - Plans (Gratuit, Starter, Pro, Enterprise)
   - Limites (nombre de plats, commandes/mois, etc.)
   - Facturation (Stripe Billing)

2. **Multi-Tenant**
   - Subdomain personnalisé (`restaurant1.camcook.fr`)
   - Domaine personnalisé (`restaurant1.com`)
   - Branding personnalisé (logo, couleurs)

3. **Onboarding**
   - Inscription restaurant
   - Création automatique du restaurant
   - Configuration initiale (menu, horaires, etc.)

4. **Super Admin**
   - Dashboard super admin (tous les restaurants)
   - Gestion des abonnements
   - Support client

---

## 7. PLAN DE TRANSFORMATION RECOMMANDÉ

### Phase 1 : Préparation (Backend)

1. **Migration Base de Données**
   - Ajouter `restaurantId` aux modèles globalisés :
     - `Accompaniment`
     - `Drink`
     - `ContactMessage` (optionnel)
   - Créer migration Sequelize

2. **Refactoring Controllers**
   - Remplacer `resolveCamcook()` par `getCurrentRestaurant()`
   - Ajouter middleware `restaurantContext` pour identifier le restaurant
   - Filtrer automatiquement par `restaurantId` dans les requêtes

3. **Nouvelles Routes**
   - `/api/restaurants/:id/info` (au lieu de `/info`)
   - `/api/restaurants/:id/menu` (au lieu de `/menu`)
   - `/api/restaurants` : Liste des restaurants (public)
   - `/api/restaurants/:id` : Détails restaurant (public)

### Phase 2 : Multi-Tenant (Backend)

1. **Identification Restaurant**
   - Middleware `restaurantContext` :
     - Vérifier subdomain
     - Vérifier paramètre `restaurantId`
     - Vérifier header `X-Restaurant-Id`
     - Ajouter `req.restaurant` pour tous les endpoints

2. **Isolation des Données**
   - Middleware `restaurantFilter` :
     - Filtrer automatiquement par `restaurantId`
     - Vérifier les permissions (owner/admin)

3. **Admin Dashboard**
   - Filtrer par `restaurantId` pour les owners
   - Permettre vue globale pour super admin

### Phase 3 : Frontend

1. **Context Restaurant**
   - Créer `RestaurantContext` :
     - Restaurant actuel
     - Fonctions de sélection
     - Persistance (AsyncStorage)

2. **Sélection Restaurant**
   - Écran de sélection au démarrage
   - Liste des restaurants disponibles
   - Recherche par nom/localisation

3. **Routes Dynamiques**
   - Adapter les appels API avec `restaurantId`
   - Remplacer les endpoints hard-codés

4. **UI Personnalisée**
   - Logo du restaurant dans le Header
   - Couleurs personnalisables (si implémenté)
   - Footer avec infos restaurant

### Phase 4 : Fonctionnalités SaaS

1. **Abonnements**
   - Modèle `Subscription`
   - Plans et limites
   - Intégration Stripe Billing

2. **Onboarding**
   - Inscription restaurant
   - Création automatique
   - Guide de configuration

3. **Super Admin**
   - Dashboard global
   - Gestion des restaurants
   - Support client

---

## 8. ESTIMATION DE COMPLEXITÉ

| Tâche | Complexité | Temps Estimé |
|-------|------------|--------------|
| Migration BDD (ajout `restaurantId`) | Moyenne | 2-3 jours |
| Refactoring Controllers | Élevée | 5-7 jours |
| Middleware Multi-Tenant | Moyenne | 3-4 jours |
| Context Restaurant (Frontend) | Faible | 1-2 jours |
| Sélection Restaurant (Frontend) | Moyenne | 2-3 jours |
| Adaptation Routes API | Moyenne | 3-4 jours |
| Tests et Debug | Élevée | 5-7 jours |
| **TOTAL** | | **21-30 jours** |

---

## 9. RECOMMANDATIONS

### 9.1 Priorités

1. **CRITIQUE** : Isolation des données (sécurité)
2. **IMPORTANT** : Middleware multi-tenant
3. **IMPORTANT** : Refactoring endpoints hard-codés
4. **MOYEN** : Context restaurant frontend
5. **MOYEN** : Sélection restaurant
6. **FACULTATIF** : Abonnements (Phase 2)

### 9.2 Approche Recommandée

1. **Backend First** : Commencer par isoler les données backend
2. **Tests** : Tester l'isolation avec plusieurs restaurants
3. **Frontend** : Adapter le frontend une fois le backend stable
4. **Itération** : Implémenter fonctionnalité par fonctionnalité

### 9.3 Points d'Attention

- **Sécurité** : Vérifier que les owners ne peuvent accéder qu'à leurs données
- **Performance** : Indexer `restaurantId` dans la BDD
- **Compatibilité** : Maintenir la compatibilité avec l'app existante pendant la migration
- **Tests** : Tests exhaustifs avec plusieurs restaurants simultanés

---

## 10. CONCLUSION

**État Actuel** : Application mono-restaurant avec structure BDD multi-restaurant partielle

**Objectif** : SaaS multi-restaurants avec isolation complète des données

**Points Positifs** :
- ✅ Structure BDD déjà partiellement multi-restaurant
- ✅ Authentification avec rôles
- ✅ API REST structurée

**Points à Corriger** :
- ❌ Endpoints hard-codés CamCook
- ❌ Modèles globalisés (Accompaniment, Drink)
- ❌ Frontend mono-restaurant
- ❌ Pas de middleware multi-tenant

**Complexité Estimée** : **Moyenne à Élevée** (21-30 jours)

---

**Document créé le** : 2025-01-27  
**Version** : 1.0

