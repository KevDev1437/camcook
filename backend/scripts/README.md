# Scripts de génération d'apps White Label

## 📋 Script: `create-client-app.sh`

Ce script permet de générer automatiquement une nouvelle app White Label pour un client en copiant le code source et en personnalisant toutes les configurations nécessaires.

### 🚀 Utilisation

```bash
./create-client-app.sh "Restaurant Name" RESTAURANT_ID "email@example.com" [PRIMARY_COLOR] [SECONDARY_COLOR]
```

### 📝 Paramètres

1. **Restaurant Name** (obligatoire) : Nom du restaurant (ex: "Burger House")
2. **RESTAURANT_ID** (obligatoire) : ID du restaurant dans la base de données (ex: 5)
3. **Email** (obligatoire) : Email de contact du restaurant
4. **PRIMARY_COLOR** (optionnel) : Couleur primaire en hexadécimal (défaut: #FF6B6B)
5. **SECONDARY_COLOR** (optionnel) : Couleur secondaire en hexadécimal (défaut: #4ECDC4)

### 💡 Exemples

```bash
# Exemple basique
./create-client-app.sh "Burger House" 5 "contact@burgerhouse.com"

# Exemple avec couleurs personnalisées
./create-client-app.sh "Pizza Palace" 10 "contact@pizzapalace.com" "#FF5733" "#4ECDC4"

# Exemple avec slug personnalisé
./create-client-app.sh "Le Gourmet" 15 "contact@legourmet.fr" "#8B4513" "#DAA520"
```

### 📁 Structure générée

Le script crée une nouvelle app dans le dossier `../clients/{slug}-app/` avec :

- ✅ Copie complète du code source (sans node_modules, .git, etc.)
- ✅ Configuration automatique de `restaurant.config.js` avec le RESTAURANT_ID
- ✅ Configuration de `app.json` avec le nom et bundle ID
- ✅ Création de `.env` avec toutes les variables d'environnement
- ✅ Génération d'un README.md personnalisé pour le client
- ✅ Fichier de configuration client (`CLIENT_CONFIG.md`)

### 🔧 Prérequis

- Bash (Linux/Mac) ou Git Bash (Windows)
- Le dossier `mobile-expo` doit exister à la racine du projet
- rsync (installé par défaut sur Linux/Mac, peut nécessiter une installation sur Windows)

### 📦 Ce que le script fait

1. **Validation des paramètres** : Vérifie que tous les paramètres requis sont fournis
2. **Génération du slug** : Crée un slug à partir du nom du restaurant (minuscules, tirets)
3. **Génération du bundle ID** : Crée un bundle ID unique (ex: `com.camcook.burger-house`)
4. **Copie du code** : Copie tout le code source de `mobile-expo/` vers `clients/{slug}-app/`
5. **Configuration** : Modifie tous les fichiers nécessaires avec les bonnes valeurs
6. **Documentation** : Génère un README complet pour le client

### 🎯 Fichiers modifiés automatiquement

- `src/config/restaurant.config.js` - Configuration du restaurant ID
- `app.json` - Nom de l'app, slug, bundle ID
- `package.json` - Nom du package
- `.env` - Variables d'environnement
- `README.md` - Documentation complète

### ⚠️ Notes importantes

1. **Sur Windows** : Utilisez Git Bash ou WSL pour exécuter le script
2. **Permissions** : Sur Linux/Mac, assurez-vous que le script est exécutable (`chmod +x create-client-app.sh`)
3. **Rsync** : Si rsync n'est pas disponible, le script peut être modifié pour utiliser `cp -r`
4. **Dossier existant** : Si l'app existe déjà, le script demande confirmation avant de la remplacer

### 🚀 Prochaines étapes après la génération

Une fois l'app générée, le client doit :

1. `cd clients/{slug}-app`
2. `npm install`
3. `npm start`
4. Scanner le QR code avec Expo Go
5. Pour la production : `eas build --platform all`

### 📞 Support

Pour toute question ou problème avec le script, contactez l'équipe de développement.



