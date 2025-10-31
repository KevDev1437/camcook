# CamCook Backend API

API REST pour l'application CamCook construite avec Node.js, Express et MySQL.

## Installation

```bash
npm install
```

## Configuration

1. **Installer et démarrer MySQL**
   - Si vous utilisez XAMPP/WAMP, démarrer MySQL
   - Créer une base de données `camcook`

2. Copier le fichier `.env.example` vers `.env`

3. Configurer les variables d'environnement :

```env
# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=camcook
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql

# Server
PORT=5000
JWT_SECRET=your_secret_key
```

## Initialisation de la base de données

### Créer les tables et données de test
```bash
npm run reset-db
```
Cette commande va :
- Supprimer et recréer toutes les tables
- Insérer des données de test (utilisateurs, restaurants, plats)

### Mettre à jour le schéma sans supprimer les données
```bash
npm run init-db
```

### Ajouter uniquement des données de test
```bash
npm run seed-db
```

## Démarrage

### Mode développement (avec auto-reload)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## Accès à la base de données

Vous pouvez gérer la base de données via **phpMyAdmin** :
- URL : `http://localhost/phpmyadmin` (si XAMPP/WAMP)
- Tables créées : `users`, `addresses`, `restaurants`, `menu_items`, `orders`

## Structure du projet

```
backend/
├── src/
│   ├── config/           # Configuration (database, etc.)
│   ├── controllers/      # Logique métier
│   ├── middleware/       # Middlewares (auth, etc.)
│   ├── models/           # Modèles Sequelize (MySQL)
│   ├── routes/           # Routes API
│   ├── utils/            # Fonctions utilitaires
│   └── server.js         # Point d'entrée
├── scripts/              # Scripts d'initialisation
│   ├── init-db.js        # Création des tables
│   └── seed-db.js        # Données de test
├── .env                  # Variables d'environnement
├── .env.example          # Exemple de configuration
└── package.json
```

## Modèles de données

### User
- Clients, restaurateurs et administrateurs
- Authentification avec JWT et bcrypt
- Relations : addresses, restaurants, orders

### Address
- Adresses de livraison des utilisateurs
- Coordonnées GPS pour la localisation

### Restaurant
- Informations du restaurant
- Horaires d'ouverture (JSON)
- Options de livraison/retrait
- Relation avec l'utilisateur propriétaire

### MenuItem
- Plats du menu
- Catégories, prix, images (JSON)
- Options et personnalisations
- Allergènes et informations nutritionnelles

### Order
- Commandes clients
- Statuts de commande (pending, confirmed, preparing, ready, completed, etc.)
- Numéro de commande unique généré automatiquement
- Informations de paiement et livraison

## Relations entre les tables

```
User (1) -> (*) Address
User (1) -> (*) Restaurant
User (1) -> (*) Order

Restaurant (1) -> (*) MenuItem
Restaurant (1) -> (*) Order
```

## Comptes de test

Après avoir exécuté `npm run reset-db`, vous aurez accès à :

- **Client** : customer@camcook.com / password123
- **Restaurant** : restaurant@camcook.com / password123
- **Admin** : admin@camcook.com / password123

## Routes API

Consultez le fichier README.md principal pour la liste complète des endpoints.

## Scripts disponibles

- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer en mode développement avec nodemon
- `npm run init-db` - Créer/mettre à jour les tables
- `npm run seed-db` - Ajouter des données de test
- `npm run reset-db` - Réinitialiser complètement la base de données

## Sécurité

- Mots de passe hashés avec bcrypt
- Authentification JWT
- Protection CORS
- Validation des données avec express-validator
- Variables sensibles dans .env (non versionnées)
