# Mini house - App Mobile

Application mobile White Label pour Mini house.

## 📋 Informations de l'app

- **Restaurant ID:** 4
- **Nom:** Mini house
- **Slug:** mini-house
- **Bundle ID:** com.camcook.mini-house
- **Email:** mini@gmail.com

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app sur votre téléphone (pour le développement)

### Étapes d'installation

1. **Installer les dépendances:**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement:**
   ```bash
   cp .env.example .env
   # Modifier .env avec vos configurations
   ```

3. **Démarrer l'app:**
   ```bash
   npm start
   ```

4. **Scanner le QR code** avec Expo Go (iOS) ou l'app Camera (Android)

## 🏗️ Build de production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

### Les deux plateformes

```bash
eas build --platform all
```

## 📱 Configuration

### Restaurant ID

Le Restaurant ID est configuré dans `src/config/restaurant.config.js`:
```javascript
export const RESTAURANT_ID = 4;
```

### Couleurs du thème

Les couleurs peuvent être configurées dans `src/config/restaurant.config.js` ou via les variables d'environnement:
- `PRIMARY_COLOR`: #f31212
- `SECONDARY_COLOR`: #1dd7cb

## 🔧 Développement

### Structure du projet

- `src/`: Code source de l'application
- `src/config/`: Configuration (API, restaurant, Stripe)
- `src/components/`: Composants React Native
- `src/screens/`: Écrans de l'application
- `src/services/`: Services API
- `src/context/`: Contextes React (Auth, Cart, etc.)

### Scripts disponibles

- `npm start`: Démarrer le serveur de développement Expo
- `npm run android`: Démarrer sur Android
- `npm run ios`: Démarrer sur iOS
- `npm run web`: Démarrer sur Web

## 📞 Support

Pour toute question ou problème, contactez le support technique.

## 📄 Licence

Application propriétaire - Mini house

---

**Généré automatiquement le:** 2025-11-08 13:35:38
