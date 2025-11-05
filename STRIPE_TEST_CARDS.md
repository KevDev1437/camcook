# Cartes de Test Stripe - CamCook

## 🧪 Cartes de Test Stripe

Utilisez ces cartes pour tester les paiements **sans utiliser de vraies cartes bancaires**.

### ✅ Carte de Test - Succès

**Numéro de carte :** `4242 4242 4242 4242`
- **Date d'expiration :** N'importe quelle date future (ex: `12/25`, `12/30`)
- **CVC :** N'importe quel 3 chiffres (ex: `123`, `456`)
- **Code postal :** N'importe quel code postal valide (ex: `75001`, `10000`)
- **Résultat :** ✅ Paiement réussi

### ❌ Carte de Test - Échec

**Numéro de carte :** `4000 0000 0000 0002`
- **Date d'expiration :** N'importe quelle date future (ex: `12/25`)
- **CVC :** N'importe quel 3 chiffres (ex: `123`)
- **Code postal :** N'importe quel code postal valide (ex: `75001`)
- **Résultat :** ❌ Paiement échoué (carte refusée)

### 🔐 Carte de Test - 3D Secure (Authentification)

**Numéro de carte :** `4000 0025 0000 3155`
- **Date d'expiration :** N'importe quelle date future (ex: `12/25`)
- **CVC :** N'importe quel 3 chiffres (ex: `123`)
- **Code postal :** N'importe quel code postal valide (ex: `75001`)
- **Résultat :** 🔐 Demande une authentification (3D Secure)

### 💳 Autres Cartes de Test

| Numéro de Carte | Description | Résultat |
|----------------|-------------|----------|
| `4242 4242 4242 4242` | Visa - Succès | ✅ Réussi |
| `4000 0000 0000 0002` | Visa - Échec | ❌ Refusé |
| `4000 0025 0000 3155` | Visa - 3D Secure | 🔐 Authentification requise |
| `5555 5555 5555 4444` | Mastercard - Succès | ✅ Réussi |
| `4000 0000 0000 9995` | Visa - Fonds insuffisants | ❌ Refusé |
| `4000 0000 0000 3220` | Visa - Carte expirée | ❌ Refusé |

## 📝 Informations à remplir

Pour toutes les cartes de test, utilisez :

- **Nom sur la carte :** N'importe quel nom (ex: `Test User`, `John Doe`)
- **Date d'expiration :** N'importe quelle date future (ex: `12/25`, `01/30`)
- **CVC :** N'importe quel 3 chiffres (ex: `123`, `456`, `789`)
- **Code postal :** N'importe quel code postal valide (ex: `75001`, `10000`)

## ⚠️ Important

- Ces cartes fonctionnent **uniquement en mode test** (avec `pk_test_...`)
- Elles ne fonctionnent **pas en production** (avec `pk_live_...`)
- Aucun vrai paiement ne sera effectué
- Aucun vrai argent ne sera débité

## 🔍 Vérifier votre Configuration

Assurez-vous que :

1. **Backend** : `STRIPE_SECRET_KEY=sk_test_...` dans `backend/.env`
2. **Frontend** : `STRIPE_PUBLISHABLE_KEY=pk_test_...` dans `mobile-expo/src/config/stripe.js`
3. **Mode test** : Les deux clés doivent commencer par `test_`

## 📚 Documentation

Pour plus d'informations sur les cartes de test Stripe :
- [Stripe Testing](https://stripe.com/docs/testing)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)




