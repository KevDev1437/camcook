# Flux de Paiement - CamCook

## 💰 Que se passe-t-il après un paiement effectué ?

### 1. **Flux du Paiement**

Lorsqu'un client effectue un paiement :

1. **Création du Payment Intent** (Stripe)
   - Le backend crée un Payment Intent dans Stripe
   - Le montant est converti en centimes (ex: 18.00 € → 1800 centimes)
   - Un `clientSecret` est généré

2. **Paiement côté Client**
   - Le client entre ses informations de carte dans le Payment Sheet
   - Stripe traite le paiement de manière sécurisée
   - Le paiement est validé par Stripe

3. **Confirmation du Paiement**
   - Le frontend envoie une confirmation au backend
   - Le backend vérifie le statut du Payment Intent dans Stripe
   - Si le paiement est réussi (`succeeded`), la commande est mise à jour

4. **Mise à jour de la Commande**
   - `paymentStatus` → `'paid'`
   - `stripePaymentIntentId` → ID du Payment Intent Stripe
   - `paymentMethod` → `'stripe_card'`, `'stripe_apple_pay'`, ou `'stripe_google_pay'`

### 2. **Où va l'argent ?**

L'argent va directement dans votre **compte Stripe** :

- **Compte Stripe** : L'argent est déposé dans votre compte Stripe
- **Virement bancaire** : Stripe vous verse l'argent sur votre compte bancaire (selon votre configuration)
- **Frais Stripe** : Stripe prélève des frais de transaction (environ 1.4% + 0.25€ par transaction en Europe)

#### Configuration Stripe

1. **Compte Stripe** : Connectez-vous à [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Paramètres** : Configurez votre compte bancaire pour recevoir les paiements
3. **Virements** : Stripe effectue des virements automatiques selon votre configuration

### 3. **Suivi des Paiements**

#### Dashboard Stripe

Vous pouvez voir tous les paiements dans le **Dashboard Stripe** :

- **URL** : [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)
- **Informations disponibles** :
  - Montant du paiement
  - Statut (succeeded, failed, pending)
  - Méthode de paiement (carte, Apple Pay, Google Pay)
  - Date et heure
  - Détails du client
  - ID du Payment Intent

#### Dashboard Admin CamCook

Actuellement, le dashboard admin affiche :
- ✅ Les commandes avec leur statut
- ✅ Le montant total des commandes
- ⚠️ **Pas encore** : Liste détaillée des paiements Stripe

**Note** : Une fonctionnalité pour afficher les paiements dans le dashboard admin sera ajoutée prochainement.

### 4. **Ce qui est stocké dans la Base de Données**

Dans la table `orders`, chaque commande contient :

- `paymentStatus` : `'pending'`, `'paid'`, `'failed'`, ou `'refunded'`
- `paymentMethod` : `'cash'`, `'stripe_card'`, `'stripe_apple_pay'`, `'stripe_google_pay'`
- `stripePaymentIntentId` : ID du Payment Intent Stripe (pour le suivi)

### 5. **Recommandations**

#### Pour le Suivi

1. **Dashboard Stripe** : Utilisez le dashboard Stripe pour voir tous les paiements en temps réel
2. **Notifications** : Configurez les webhooks Stripe pour recevoir des notifications de paiement
3. **Rapports** : Utilisez les rapports Stripe pour analyser vos ventes

#### Pour la Sécurité

- ✅ Les informations de carte bancaire ne sont **jamais** stockées dans votre base de données
- ✅ Toutes les transactions sont sécurisées par Stripe
- ✅ Les paiements sont validés par Stripe avant confirmation

## 📊 Statistiques

### Dans le Dashboard Admin

Vous pouvez voir :
- **Ventes du jour** : Total des commandes payées aujourd'hui
- **Commandes en cours** : Commandes avec statut `preparing`, `ready`, `on_delivery`
- **Détails des commandes** : Montant, statut, méthode de paiement

### Dans le Dashboard Stripe

Vous pouvez voir :
- **Tous les paiements** : Historique complet
- **Statistiques** : Revenus, nombre de transactions
- **Détails** : Informations complètes sur chaque paiement

## 🔍 Vérifier un Paiement

### Depuis le Dashboard Stripe

1. Connectez-vous à [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Payments**
3. Recherchez par :
   - ID du Payment Intent (`stripePaymentIntentId`)
   - Montant
   - Date
   - Email du client

### Depuis la Base de Données

```sql
SELECT 
  id,
  orderNumber,
  total,
  paymentStatus,
  paymentMethod,
  stripePaymentIntentId,
  createdAt
FROM orders
WHERE paymentStatus = 'paid'
ORDER BY createdAt DESC;
```

## 📝 Notes Importantes

- ⚠️ **Mode Test** : En mode test, aucun vrai paiement n'est effectué
- ⚠️ **Mode Production** : Activez le mode production uniquement quand vous êtes prêt
- ✅ **Sécurité** : Tous les paiements sont sécurisés par Stripe
- ✅ **Conformité** : Stripe est conforme PCI-DSS (sécurité des paiements)






