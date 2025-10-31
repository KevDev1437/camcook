# CamCook - Application de Restauration

Application mobile (iOS & Android) et backend pour la commande de plats en ligne avec option de livraison ou retrait sur place.

## Structure du projet

```
CamCook/
├── backend/          # API REST Node.js + Express + MySQL
├── mobile/           # Application React Native (iOS + Android)
└── shared/           # Code partagé (types, constantes)
```

## Technologies utilisées

### Backend
- **Node.js** avec Express
- **MySQL** avec Sequelize ORM
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe

### Mobile
- **React Native** 0.82.1
- **React Navigation** pour la navigation
- **Axios** pour les appels API
- **React Native Vector Icons** pour les icônes

## Installation

### Backend

1. **Installer MySQL** localement (XAMPP, WAMP, ou MySQL standalone)
   - Démarrer MySQL (port 3306)
   - Créer une base de données nommée `camcook`

2. Naviguer dans le dossier backend :
   ```bash
   cd backend
   npm install
   ```

3. Copier `.env.example` vers `.env` et configurer les variables :
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=camcook
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   ```

4. Initialiser la base de données :
   ```bash
   npm run reset-db
   ```
   Cela va créer toutes les tables et insérer des données de test.

5. Démarrer le serveur :
   ```bash
   npm run dev
   ```

Le serveur démarre sur `http://localhost:5000`

**Accès phpMyAdmin** : Gérez votre base de données via phpMyAdmin (généralement http://localhost/phpmyadmin)

### Mobile

1. Installer les dépendances :
   ```bash
   cd mobile
   npm install
   ```

2. Pour Android :
   ```bash
   npx react-native run-android
   ```

3. Pour iOS (Mac uniquement) :
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

## Fonctionnalités principales

### Client
- ✅ Parcourir les restaurants
- ✅ Consulter les menus et plats
- ✅ Ajouter des articles au panier
- ✅ Passer des commandes (livraison/retrait)
- ✅ Suivre l'état des commandes en temps réel
- ✅ Historique des commandes
- ✅ Gestion du profil et adresses

### Restaurant
- Gestion du restaurant (informations, horaires)
- Gestion du menu (plats, catégories, prix)
- Réception et traitement des commandes
- Mise à jour du statut des commandes

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Restaurants
- `GET /api/restaurants` - Liste des restaurants
- `GET /api/restaurants/:id` - Détails d'un restaurant
- `POST /api/restaurants` - Créer un restaurant (authentifié)

### Menus
- `GET /api/menus/restaurant/:id` - Menu d'un restaurant
- `POST /api/menus` - Ajouter un plat (authentifié)

### Commandes
- `POST /api/orders` - Créer une commande (authentifié)
- `GET /api/orders/my-orders` - Mes commandes (authentifié)
- `GET /api/orders/:id` - Détails d'une commande (authentifié)

## Configuration requise

- Node.js >= 20.17.0
- npm >= 11.0.0
- MySQL >= 5.7 ou MariaDB >= 10.2
- phpMyAdmin (recommandé pour la gestion de la base de données)
- Android Studio (pour Android)
- Xcode (pour iOS - Mac uniquement)

## Prochaines étapes

1. Implémenter les controllers complets pour toutes les routes
2. Ajouter l'authentification dans l'app mobile (AsyncStorage)
3. Intégrer un système de paiement (Stripe)
4. Ajouter les notifications push (Firebase)
5. Intégrer Google Maps pour la localisation
6. Ajouter des images avec upload
7. Implémenter le système de notation et avis
8. Tests unitaires et d'intégration

## License

Propriétaire - Tous droits réservés
