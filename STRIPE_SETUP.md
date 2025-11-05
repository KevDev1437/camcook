# Configuration Stripe - CamCook

## 📋 Prérequis

1. **Compte Stripe** : Créez un compte sur [https://stripe.com](https://stripe.com)
2. **Clés API** : Récupérez vos clés API depuis le dashboard Stripe

## 🔧 Configuration Backend

### 1. Ajouter les variables d'environnement

Dans `backend/.env`, ajoutez :

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Clé secrète de test
# Pour la production, utilisez : sk_live_...
```

### 2. Trouver vos clés Stripe

1. Connectez-vous à [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Developers > API keys**
3. Copiez :
   - **Secret key** → `STRIPE_SECRET_KEY` dans `.env`
   - **Publishable key** → `STRIPE_PUBLISHABLE_KEY` dans `mobile-expo/src/config/stripe.js`

### 3. Mode Test vs Production

- **Mode Test** : Utilisez les clés avec `_test_` (ex: `sk_test_...`, `pk_test_...`)
- **Mode Production** : Utilisez les clés avec `_live_` (ex: `sk_live_...`, `pk_live_...`)

## 📱 Configuration Frontend

### 1. Mettre à jour la clé publique

Dans `mobile-expo/src/config/stripe.js`, remplacez :

```javascript
export const STRIPE_PUBLISHABLE_KEY = __DEV__
  ? 'pk_test_...' // Remplacez par votre clé publique de test
  : 'pk_live_...'; // Remplacez par votre clé publique de production
```

## 🚀 Démarrage

### 1. Redémarrer le backend

```bash
cd backend
npm run dev
```

### 2. Redémarrer l'application mobile

```bash
cd mobile-expo
npm start
```

## 📝 Notes importantes

### Apple Pay et Google Pay

⚠️ **Important** : Apple Pay et Google Pay nécessitent un **développement build Expo** (pas Expo Go).

Pour utiliser ces fonctionnalités :

1. Installez `expo-dev-client` :
   ```bash
   npx expo install expo-dev-client
   ```

2. Créez un développement build :
   ```bash
   npx expo prebuild
   npx expo run:ios  # ou run:android
   ```

### Carte bancaire uniquement

Si vous utilisez **Expo Go**, seule la méthode **carte bancaire** fonctionnera. Apple Pay et Google Pay nécessitent un développement build.

## 🧪 Tester les paiements

### Cartes de test Stripe

Utilisez ces cartes pour tester :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

Date d'expiration : n'importe quelle date future
CVC : n'importe quel 3 chiffres

Plus d'informations : [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

## 🔒 Sécurité

- ⚠️ **NE JAMAIS** commiter les clés secrètes dans Git
- ✅ Utilisez `.env` pour les variables sensibles
- ✅ Ajoutez `.env` à `.gitignore`
- ✅ Utilisez les clés de test en développement
- ✅ Activez le mode production uniquement en production

## 📚 Documentation

- [Stripe React Native](https://stripe.dev/stripe-react-native/)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Apple Pay Setup](https://stripe.com/docs/apple-pay)
- [Google Pay Setup](https://stripe.com/docs/google-pay)


