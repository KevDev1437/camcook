# 🔐 Récapitulatif des Identifiants - CamCook SaaS

## 📊 Situation Actuelle

### ⚠️ PROBLÈME ACTUEL

**Tous les restaurants utilisent le même compte admin !**

- **Super Admin** : `admin@camcook.fr` / `password123` (rôle: `admin`)
- **Admin CamCook** : `admin@camcook.fr` / `password123` (même compte)
- **Admin Burger House** : `admin@camcook.fr` / `password123` (même compte)

**Pourquoi ?** Le script `seed-db.js` crée un seul utilisateur admin qui devient le propriétaire (`ownerId`) de tous les restaurants.

---

## 🎯 Solution Recommandée : Créer des Utilisateurs Séparés

### 1. Super Admin (Plateforme)

**Identifiants** :
- Email : `admin@camcook.fr`
- Password : `password123`
- Rôle : `admin`
- Accès : Dashboard Super Admin (`http://localhost:5000/admin`)

**Utilisation** :
- Gérer tous les restaurants
- Voir les statistiques globales
- Créer/modifier/supprimer des restaurants
- Modifier les abonnements

---

### 2. Admin CamCook (Restaurant Owner)

**Identifiants recommandés** :
- Email : `owner@camcook.fr` ou `admin@camcook.fr`
- Password : `password123` (ou un mot de passe différent)
- Rôle : `restaurant` (ou `admin` si vous voulez qu'il puisse aussi accéder au Super Admin)
- Restaurant : CamCook (ID: 3)

**Utilisation** :
- Gérer le menu du restaurant CamCook
- Voir les commandes du restaurant CamCook
- Gérer les accompagnements et boissons du restaurant CamCook
- Accéder à l'app mobile CamCook

**Création** :
```bash
node backend/scripts/create-restaurant-owner.js "CamCook Owner" "owner@camcook.fr" "password123" 3
```

---

### 3. Admin Burger House (Restaurant Owner)

**Identifiants recommandés** :
- Email : `owner@burgerhouse.com` ou `admin@burgerhouse.com`
- Password : `password123` (ou un mot de passe différent)
- Rôle : `restaurant`
- Restaurant : Burger House (ID: 5)

**Utilisation** :
- Gérer le menu du restaurant Burger House
- Voir les commandes du restaurant Burger House
- Gérer les accompagnements et boissons du restaurant Burger House
- Accéder à l'app mobile Burger House

**Création** :
```bash
node backend/scripts/create-restaurant-owner.js "Burger House Owner" "owner@burgerhouse.com" "password123" 5
```

---

## 🔧 Script de Création d'Utilisateurs

J'ai créé un script pour créer facilement des utilisateurs propriétaires de restaurants :

```bash
node backend/scripts/create-restaurant-owner.js "Nom du Propriétaire" "email@example.com" "mot_de_passe" RESTAURANT_ID
```

**Exemple** :
```bash
# Créer un owner pour CamCook
node backend/scripts/create-restaurant-owner.js "CamCook Owner" "owner@camcook.fr" "password123" 3

# Créer un owner pour Burger House
node backend/scripts/create-restaurant-owner.js "Burger House Owner" "owner@burgerhouse.com" "password123" 5
```

---

## 📋 Tableau Récapitulatif

| Type d'Utilisateur | Email | Password | Rôle | Restaurant | Accès |
|-------------------|-------|----------|------|------------|-------|
| **Super Admin** | `admin@camcook.fr` | `password123` | `admin` | Tous | Dashboard Super Admin |
| **Admin CamCook** | `owner@camcook.fr` | `password123` | `restaurant` | CamCook (ID: 3) | App mobile + Backend API |
| **Admin Burger House** | `owner@burgerhouse.com` | `password123` | `restaurant` | Burger House (ID: 5) | App mobile + Backend API |

---

## 🔍 Vérifier les Utilisateurs Existants

### Via MySQL

```sql
USE camcook;

-- Voir tous les utilisateurs
SELECT id, name, email, role FROM users;

-- Voir les restaurants et leurs owners
SELECT r.id, r.name, r.email, u.id as owner_id, u.name as owner_name, u.email as owner_email
FROM restaurants r
LEFT JOIN users u ON r.ownerId = u.id;
```

### Via Script Node.js

```bash
node backend/scripts/list-users-and-restaurants.js
```

---

## ⚠️ IMPORTANT : Sécurité

1. **Changez les mots de passe par défaut** après la première connexion
2. **Créez des utilisateurs séparés** pour chaque restaurant
3. **Utilisez des mots de passe forts** (minimum 12 caractères)
4. **Ne partagez pas les identifiants** entre restaurants

---

## 🚀 Prochaines Étapes

1. **Créer un utilisateur owner pour CamCook** :
   ```bash
   node backend/scripts/create-restaurant-owner.js "CamCook Owner" "owner@camcook.fr" "password123" 3
   ```

2. **Créer un utilisateur owner pour Burger House** :
   ```bash
   node backend/scripts/create-restaurant-owner.js "Burger House Owner" "owner@burgerhouse.com" "password123" 5
   ```

3. **Mettre à jour les restaurants** pour utiliser les nouveaux owners :
   ```sql
   UPDATE restaurants SET ownerId = [NOUVEL_OWNER_ID] WHERE id = [RESTAURANT_ID];
   ```

4. **Tester les connexions** avec les nouveaux identifiants

---

**Dernière mise à jour** : 2025-01-05


