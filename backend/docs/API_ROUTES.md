# 📚 Documentation des Routes API - CamCook SaaS Platform

**Version :** 1.0  
**Date :** 2025-01-XX  
**Base URL :** `/api`

---

## 📋 Légende

| Colonne | Description |
|---------|-------------|
| **Route** | Chemin de l'endpoint |
| **Méthode** | HTTP Method (GET, POST, PUT, DELETE, PATCH) |
| **Auth** | Type d'authentification : `Public`, `protect`, `protect + authorize(roles)` |
| **RestaurantContext** | `required`, `optional`, ou `none` |
| **Validation** | Schéma Joi utilisé (si applicable) |
| **Description** | Description courte de l'endpoint |

---

## 🔐 Authentification

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/auth/register` | POST | Public | optional | - | Inscription d'un nouvel utilisateur |
| `/auth/login` | POST | Public | optional | - | Connexion utilisateur |
| `/auth/refresh` | POST | Public | none | - | Rafraîchir le token JWT |
| `/auth/me` | GET | protect | none | - | Obtenir les informations de l'utilisateur connecté |

---

## 👤 Utilisateurs

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/users/profile` | GET | protect | none | - | Obtenir le profil de l'utilisateur |
| `/users/profile` | PUT | protect | none | - | Mettre à jour le profil utilisateur |
| `/users/addresses` | GET | protect | none | - | Liste des adresses de l'utilisateur |
| `/users/addresses/:id` | GET | protect | none | - | Obtenir une adresse par ID |
| `/users/addresses` | POST | protect | none | - | Créer une nouvelle adresse |
| `/users/addresses/:id` | PUT | protect | none | - | Mettre à jour une adresse |
| `/users/addresses/:id` | DELETE | protect | none | - | Supprimer une adresse |
| `/users/addresses/:id/default` | PATCH | protect | none | - | Définir une adresse par défaut |

---

## 🏪 Restaurants

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/restaurants/info` | GET | protectOptional | required | - | Obtenir les informations d'un restaurant |
| `/restaurants/menu` | GET | protectOptional | required | - | Obtenir le menu d'un restaurant |
| `/restaurants/:id/menu` | GET | Public | required | - | Obtenir le menu d'un restaurant (alternative) |
| `/restaurants/slug/:slug` | GET | Public | none | - | Obtenir un restaurant par son slug |
| `/restaurants/list` | GET | Public | optional | - | Liste publique de tous les restaurants |
| `/restaurants` | PUT | protect + authorize('adminrestaurant', 'superadmin') | required | - | Mettre à jour les informations d'un restaurant |

---

## 🍽️ Menu Items

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/menus/restaurant/:restaurantId` | GET | Public | required | - | Obtenir tous les plats d'un restaurant |
| `/menus/:id` | GET | Public | required | - | Obtenir un plat par ID |
| `/menus` | POST | protect + authorize('adminrestaurant', 'superadmin') | required | `createMenuItem` | Créer un nouveau plat |
| `/menus/:id` | PUT | protect + authorize('adminrestaurant', 'superadmin') | required | - | Mettre à jour un plat |
| `/menus/:id` | DELETE | protect + authorize('adminrestaurant', 'superadmin') | required | - | Supprimer un plat |

---

## 🛒 Commandes

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/orders` | POST | protect | required | `createOrder` | Créer une nouvelle commande |
| `/orders/my-orders` | GET | protect | required | - | Obtenir les commandes de l'utilisateur connecté |
| `/orders/:id` | GET | protect | optional | - | Obtenir une commande par ID |
| `/orders/restaurant` | GET | protect + authorize('adminrestaurant', 'superadmin') | required | - | Obtenir les commandes d'un restaurant (owner) |
| `/orders/:id/status` | PUT | protect + authorize('adminrestaurant', 'superadmin') | required | - | Mettre à jour le statut d'une commande |
| `/orders` | GET | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Obtenir toutes les commandes (admin) |

---

## ⭐ Avis (Reviews)

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/reviews` | POST | protect | optional | - | Créer un nouvel avis sur un plat |
| `/reviews/menu-items/:menuItemId` | GET | Public | optional | - | Obtenir tous les avis d'un plat |
| `/reviews/menu-items/:menuItemId/stats` | GET | Public | optional | - | Obtenir les statistiques des avis d'un plat |
| `/reviews/:reviewId` | GET | Public | optional | - | Obtenir un avis spécifique |
| `/reviews/:reviewId` | PUT | protect | optional | - | Mettre à jour un avis |
| `/reviews/:reviewId` | DELETE | protect | optional | - | Supprimer un avis |

---

## ❓ Questions

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/questions` | POST | protect | optional | - | Créer une nouvelle question sur un plat |
| `/questions/menu-items/:menuItemId` | GET | Public | optional | - | Obtenir toutes les questions d'un plat |
| `/questions/menu-items/:menuItemId/stats` | GET | Public | optional | - | Obtenir les statistiques des questions d'un plat |
| `/questions/:questionId` | GET | Public | optional | - | Obtenir une question spécifique |
| `/questions/:questionId` | PUT | protect | optional | - | Mettre à jour une question |
| `/questions/:questionId` | DELETE | protect | optional | - | Supprimer une question |
| `/questions/:questionId/answer` | POST | protect | optional | - | Répondre à une question (admin/staff) |

---

## 💬 Messages de Contact

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/contact-messages` | GET | protect + authorize('adminrestaurant', 'superadmin') | required | - | Liste des messages de contact (owner/admin) |
| `/contact-messages/:id` | GET | protect + authorize('adminrestaurant', 'superadmin') | required | - | Obtenir un message par ID |
| `/contact-messages` | POST | Public | required | - | Créer un nouveau message de contact |
| `/contact-messages/:id/status` | PATCH | protect + authorize('adminrestaurant', 'superadmin') | required | - | Modifier le statut d'un message |
| `/contact-messages/:id` | DELETE | protect + authorize('adminrestaurant', 'superadmin') | required | - | Supprimer un message |

---

## 📄 Informations du Site

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/site-info` | GET | Public | optional | - | Obtenir les informations du site |
| `/site-info/contact` | POST | Public | optional | - | Envoyer un message de contact (formulaire) |
| `/site-info` | PUT | protect + authorize('superadmin') | optional | - | Mettre à jour les informations du site |

---

## 💳 Paiements

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/payments/create-intent` | POST | protect | required | - | Créer un Payment Intent pour carte bancaire |
| `/payments/create-mobile-pay-intent` | POST | protect | required | - | Créer un Payment Intent pour Apple Pay / Google Pay |
| `/payments/confirm` | POST | protect | optional | - | Confirmer un paiement |
| `/payments/refund` | POST | protect | optional | - | Rembourser un paiement (admin) |

---

## 🛒 Panier

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/cart/price-item` | POST | Public | required | - | Calculer le prix d'un article du panier |

---

## 🍽️ Accompagnements

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/accompaniments` | GET | Public | required | - | Obtenir tous les accompagnements d'un restaurant |
| `/accompaniments/:id` | GET | Public | required | - | Obtenir un accompagnement par ID |
| `/accompaniments` | POST | protect + authorize('adminrestaurant', 'superadmin') | required | - | Créer un nouvel accompagnement |
| `/accompaniments/:id` | PUT | protect + authorize('adminrestaurant', 'superadmin') | required | - | Mettre à jour un accompagnement |
| `/accompaniments/:id` | DELETE | protect + authorize('adminrestaurant', 'superadmin') | required | - | Supprimer un accompagnement |

---

## 🥤 Boissons

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/drinks` | GET | Public | required | - | Obtenir toutes les boissons d'un restaurant |
| `/drinks/:id` | GET | Public | required | - | Obtenir une boisson par ID |
| `/drinks` | POST | protect + authorize('adminrestaurant', 'superadmin') | required | - | Créer une nouvelle boisson |
| `/drinks/:id` | PUT | protect + authorize('adminrestaurant', 'superadmin') | required | - | Mettre à jour une boisson |
| `/drinks/:id` | DELETE | protect + authorize('adminrestaurant', 'superadmin') | required | - | Supprimer une boisson |

---

## 👨‍💼 Administration (Dashboard Restaurant)

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/admin/orders` | GET | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Liste des commandes (filtrées par restaurant si owner) |
| `/admin/orders/:id/status` | PATCH | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Modifier le statut d'une commande |
| `/admin/reviews` | GET | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Liste des avis (filtrées par restaurant si owner) |
| `/admin/reviews/:id/status` | PATCH | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Modifier le statut d'un avis |
| `/admin/users` | GET | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Liste des utilisateurs (filtrées par restaurant si owner) |
| `/admin/users/:id` | PATCH | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Mettre à jour un utilisateur |
| `/admin/users/:id` | DELETE | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Supprimer un utilisateur |
| `/admin/payments` | GET | protect + authorize('superadmin', 'adminrestaurant') | optional | - | Liste des paiements (filtrées par restaurant si owner) |
| `/admin/stats/active-customers` | GET | protect + authorize('superadmin', 'adminrestaurant') | none | - | Compter les clients actifs |
| `/admin/settings` | GET | protect + authorize('superadmin', 'adminrestaurant') | none | - | Obtenir les paramètres de l'admin |
| `/admin/settings` | PUT | protect + authorize('superadmin', 'adminrestaurant') | none | - | Mettre à jour les paramètres de l'admin |

---

## 🔧 Super Admin

| Route | Méthode | Auth | RestaurantContext | Validation | Description |
|-------|---------|------|-------------------|------------|-------------|
| `/superadmin/stats` | GET | protect + authorize('superadmin') | none | - | Statistiques globales de la plateforme |
| `/superadmin/restaurants` | GET | protect + authorize('superadmin') | none | - | Liste tous les restaurants avec pagination |
| `/superadmin/restaurants/:restaurantId/stats` | GET | protect + authorize('superadmin') | none | - | Statistiques d'un restaurant spécifique |
| `/superadmin/restaurants` | POST | protect + authorize('superadmin') | none | `createRestaurant` | Créer un nouveau restaurant |
| `/superadmin/restaurants/:restaurantId/subscription` | PUT | protect + authorize('superadmin') | none | `updateRestaurantSubscription` | Modifier l'abonnement d'un restaurant |
| `/superadmin/restaurants/:restaurantId/toggle-status` | PUT | protect + authorize('superadmin') | none | - | Activer/désactiver un restaurant |
| `/superadmin/restaurants/:restaurantId/logo` | PUT | protect + authorize('superadmin') | none | - | Modifier le logo d'un restaurant |
| `/superadmin/restaurants/:restaurantId/theme` | PUT | protect + authorize('superadmin') | none | - | Modifier les couleurs du thème d'un restaurant |
| `/superadmin/restaurants/:restaurantId` | DELETE | protect + authorize('superadmin') | none | - | Supprimer un restaurant (soft delete) |
| `/superadmin/available-owners` | GET | protect + authorize('superadmin') | none | - | Liste les utilisateurs disponibles comme owners |
| `/superadmin/generate-app` | POST | protect + authorize('superadmin') | none | - | Générer une app White Label pour un restaurant |

---

## 📝 Notes Importantes

### Authentification

- **Public** : Aucune authentification requise
- **protect** : Authentification JWT requise
- **protect + authorize(roles)** : Authentification + vérification du rôle

### RestaurantContext

- **required** : Le `restaurantId` est obligatoire (via header, query, env, ou param)
- **optional** : Le `restaurantId` est optionnel mais utilisé pour filtrer si disponible
- **none** : Pas de contexte restaurant nécessaire

### Validation Joi

Les endpoints avec validation Joi retournent des erreurs structurées :

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "L'email doit être valide"
    }
  ]
}
```

### Isolation Multi-Tenant

- Les routes avec `restaurantContext.required` isolent automatiquement les données par restaurant
- Les `adminrestaurant` ne peuvent accéder qu'aux données de leur restaurant
- Les `superadmin` peuvent accéder à toutes les données

### Rate Limiting

Certaines routes ont un rate limiting spécifique :
- Routes d'authentification : `authLimiter`
- Routes de paiement : `paymentLimiter`
- Routes d'upload : `uploadLimiter`

---

**Dernière mise à jour :** 2025-01-XX  
**Maintenu par :** Équipe CamCook


