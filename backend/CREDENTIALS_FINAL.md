# 🔐 Identifiants de Connexion - CamCook SaaS

## ✅ Utilisateurs Créés

### 1. 🔑 Super Admin (Plateforme)

**Identifiants** :
- **Email** : `admin@camcook.fr`
- **Password** : `password123`
- **Rôle** : `admin`
- **ID** : 1

**Accès** :
- Dashboard Super Admin : `http://localhost:5000/admin`
- API : Toutes les routes `/api/superadmin/*`
- Peut gérer tous les restaurants

**Utilisation** :
- Gérer tous les restaurants de la plateforme
- Voir les statistiques globales
- Créer/modifier/supprimer des restaurants
- Modifier les abonnements

---

### 2. 🏪 Admin CamCook (Restaurant Owner)

**Identifiants** :
- **Email** : `owner@camcook.fr`
- **Password** : `password123`
- **Rôle** : `restaurant`
- **ID** : 4
- **Restaurant** : CamCook (ID: 1)

**Accès** :
- App mobile CamCook
- API : Routes spécifiques au restaurant CamCook
- Peut gérer uniquement le restaurant CamCook

**Utilisation** :
- Gérer le menu du restaurant CamCook
- Voir les commandes du restaurant CamCook
- Gérer les accompagnements et boissons du restaurant CamCook
- Accéder à l'app mobile CamCook

---

### 3. 🏪 Admin Burger House (Restaurant Owner)

**Identifiants** :
- **Email** : `owner@burgerhouse.com`
- **Password** : `password123`
- **Rôle** : `restaurant`
- **ID** : 5
- **Restaurant** : Burger House (ID: 2)

**Accès** :
- App mobile Burger House
- API : Routes spécifiques au restaurant Burger House
- Peut gérer uniquement le restaurant Burger House

**Utilisation** :
- Gérer le menu du restaurant Burger House
- Voir les commandes du restaurant Burger House
- Gérer les accompagnements et boissons du restaurant Burger House
- Accéder à l'app mobile Burger House

---

## 📋 Tableau Récapitulatif

| Type | Email | Password | Rôle | Restaurant | ID User | ID Restaurant |
|------|-------|----------|------|------------|---------|--------------|
| **Super Admin** | `admin@camcook.fr` | `password123` | `admin` | Tous | 1 | - |
| **Admin CamCook** | `owner@camcook.fr` | `password123` | `restaurant` | CamCook | 4 | 1 |
| **Admin Burger House** | `owner@burgerhouse.com` | `password123` | `restaurant` | Burger House | 5 | 2 |

---

## 🚀 Connexion

### Via l'API

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@camcook.fr",
  "password": "password123"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@camcook.fr",
      "role": "admin"
    }
  }
}
```

### Via l'App Mobile

1. Ouvrez l'app mobile (CamCook ou Burger House)
2. Allez dans la section "Profil" ou "Connexion"
3. Utilisez les identifiants correspondants :
   - **CamCook** : `owner@camcook.fr` / `password123`
   - **Burger House** : `owner@burgerhouse.com` / `password123`

### Via le Dashboard Super Admin

1. Ouvrez votre navigateur : `http://localhost:5000/admin`
2. Connectez-vous avec : `admin@camcook.fr` / `password123`

---

## ⚠️ IMPORTANT : Sécurité

### Changer les mots de passe par défaut

**Il est fortement recommandé de changer les mots de passe par défaut après la première connexion !**

#### Option 1 : Via l'API

```bash
PUT http://localhost:5000/api/users/profile
Authorization: Bearer <VOTRE_TOKEN>
Content-Type: application/json

{
  "password": "nouveau_mot_de_passe_securise"
}
```

#### Option 2 : Via Script

```bash
# Réinitialiser le mot de passe du Super Admin
node backend/scripts/reset-admin-password.js

# Pour les owners, utilisez le même script en modifiant l'email
```

---

## 🔍 Vérifier les Utilisateurs

### Via Script

```bash
node backend/scripts/list-users-and-restaurants.js
```

### Via MySQL

```sql
USE camcook;

-- Voir tous les utilisateurs
SELECT id, name, email, role FROM users;

-- Voir les restaurants et leurs owners
SELECT r.id, r.name, u.email as owner_email, u.role
FROM restaurants r
LEFT JOIN users u ON r.ownerId = u.id;
```

---

## 📝 Créer de Nouveaux Owners

Pour créer un nouvel owner pour un restaurant :

```bash
node backend/scripts/create-restaurant-owner.js "Nom du Propriétaire" "email@example.com" "mot_de_passe" RESTAURANT_ID
```

**Exemple** :
```bash
node backend/scripts/create-restaurant-owner.js "Pizza Place Owner" "owner@pizzaplace.com" "password123" 3
```

---

## 🎯 Résumé

- ✅ **Super Admin** : `admin@camcook.fr` / `password123` (gère tous les restaurants)
- ✅ **Admin CamCook** : `owner@camcook.fr` / `password123` (gère uniquement CamCook)
- ✅ **Admin Burger House** : `owner@burgerhouse.com` / `password123` (gère uniquement Burger House)

**Chaque restaurant a maintenant son propre compte owner !** 🎉

---

**Dernière mise à jour** : 2025-01-05


