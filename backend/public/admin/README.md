# Super Admin Dashboard - CamCook SaaS

Interface web pour gérer tous les restaurants de la plateforme SaaS CamCook.

## 📋 Fonctionnalités

- **Authentification** : Login avec JWT (rôle superadmin requis)
- **Statistiques Globales** : Vue d'ensemble de la plateforme
- **Gestion des Restaurants** : Liste, création, modification, suppression
- **Statistiques par Restaurant** : Détails des performances d'un restaurant
- **Gestion des Abonnements** : Modification des plans et statuts
- **Activation/Désactivation** : Toggle du statut des restaurants
- **Filtres et Recherche** : Recherche avancée dans la liste des restaurants
- **Pagination** : Navigation dans les résultats

## 🚀 Utilisation

### Accès au Dashboard

1. Démarrez le serveur backend :
   ```bash
   cd backend
   npm start
   ```

2. Ouvrez votre navigateur et accédez à :
   ```
   http://localhost:5000/admin/
   ```

   Ou directement :
   ```
   http://localhost:5000/admin/index.html
   ```

### Connexion

1. Connectez-vous avec un compte **superadmin** :
   - Email : votre email superadmin (ex: admin@camcook.fr)
   - Password : votre mot de passe

2. Le dashboard se charge automatiquement après connexion.

## 📊 Sections du Dashboard

### 1. Dashboard (Statistiques Globales)

Affiche les statistiques globales de la plateforme :
- Total restaurants (actifs/inactifs/trial)
- Restaurants par plan (free, starter, pro, enterprise)
- Total commandes et revenus
- Statistiques mensuelles
- Nouveaux restaurants du mois
- Croissance en %

### 2. Restaurants

Liste tous les restaurants avec :
- **Filtres** : Par statut, plan, actif/inactif
- **Recherche** : Par nom, email ou slug
- **Actions** : Voir stats, modifier abonnement, activer/désactiver, supprimer
- **Pagination** : Navigation dans les résultats

### 3. Créer Restaurant

Formulaire pour créer un nouveau restaurant :
- Informations de base (nom, email, téléphone, adresse)
- ID du propriétaire (owner)
- Plan d'abonnement
- Description

## 🔧 Configuration

### URL de l'API

Par défaut, l'API est configurée pour `http://localhost:5000/api`.

Pour modifier l'URL de l'API, éditez `app.js` :

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### Authentification

Le token JWT est stocké dans `localStorage` sous la clé `adminToken`.

Le token est automatiquement envoyé dans les headers de toutes les requêtes API.

## 🎨 Personnalisation

### Couleurs

Les couleurs sont définies dans `style.css` via les variables CSS :

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #10b981;
    --danger-color: #ef4444;
    /* ... */
}
```

### Styles

Tous les styles sont dans `style.css`. Le design est responsive et compatible mobile.

## 📱 Responsive

Le dashboard est entièrement responsive :
- Desktop : Navigation complète avec tous les éléments
- Tablet : Adaptation des grilles et tableaux
- Mobile : Navigation simplifiée, tableaux scrollables

## 🔒 Sécurité

- **Authentification requise** : Toutes les routes API nécessitent un token JWT
- **Vérification du rôle** : Seuls les utilisateurs avec `role: 'superadmin'` peuvent accéder
- **Session expirée** : Déconnexion automatique si le token expire
- **Gestion des erreurs** : Messages d'erreur clairs pour l'utilisateur

## 🐛 Dépannage

### Erreur "Session expirée"

Si vous voyez "Session expirée", reconnectez-vous :
1. Cliquez sur "Déconnexion"
2. Reconnectez-vous avec vos identifiants admin

### Erreur "Accès refusé"

Assurez-vous que votre compte utilisateur a le rôle `superadmin` dans la base de données.

### Erreur de connexion API

Vérifiez que :
1. Le serveur backend est démarré
2. L'URL de l'API dans `app.js` est correcte
3. Le port 5000 n'est pas utilisé par un autre service

## 📝 Notes

- Le dashboard utilise du JavaScript vanilla (pas de framework)
- Toutes les données sont chargées dynamiquement via l'API
- Les erreurs sont affichées via des toasts et des messages
- La pagination est automatique selon les résultats

## 🔄 Mises à jour

Pour mettre à jour le dashboard :
1. Modifiez les fichiers HTML/CSS/JS
2. Rechargez la page dans le navigateur
3. Les changements sont immédiatement visibles (pas de build nécessaire)

---

**Développé pour CamCook SaaS Platform**


