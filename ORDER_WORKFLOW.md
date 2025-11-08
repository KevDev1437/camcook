# Workflow des Commandes - CamCook

## 📋 États des Commandes

### 1. **pending** — En attente
- **Description** : Commande créée, en attente de confirmation par le restaurant
- **Couleur** : Orange/Ambre (theme.warning)
- **Actions disponibles** :
  - Confirmer → `confirmed`
  - Refuser → `rejected`
  - Annuler → `cancelled`

### 2. **confirmed** — Confirmée
- **Description** : Commande validée par le restaurant, prête à être préparée
- **Couleur** : Bleu foncé (#2563eb)
- **Actions disponibles** :
  - Commencer la préparation → `preparing`
  - Annuler → `cancelled`

### 3. **preparing** — En préparation
- **Description** : Restaurant prépare la commande (cuisine en cours)
- **Couleur** : Jaune doré (#eab308)
- **Actions disponibles** :
  - Marquer comme prête → `ready`
  - Annuler → `cancelled`

### 4. **ready** — Prête
- **Description** : Commande prête à être récupérée ou livrée
- **Couleur** : Vert (theme.success)
- **Actions disponibles** :
  - Pour livraison : En livraison → `on_delivery`
  - Pour emporter : Terminer → `completed`
  - Annuler → `cancelled`

### 5. **on_delivery** — En livraison
- **Description** : Livreur en route (uniquement pour les livraisons)
- **Couleur** : Cyan (#06b6d4)
- **Actions disponibles** :
  - Terminer → `completed`
  - Annuler → `cancelled`

### 6. **completed** — Terminée
- **Description** : Commande livrée ou récupérée par le client
- **Couleur** : Vert foncé (#22c55e)
- **Actions disponibles** : Aucune (état final)

### 7. **cancelled** — Annulée
- **Description** : Commande annulée (peut être annulée à tout moment)
- **Couleur** : Rouge (theme.error)
- **Actions disponibles** : Aucune (état final)

### 8. **rejected** — Refusée
- **Description** : Restaurant refuse la commande (produit indisponible, etc.)
- **Couleur** : Rouge foncé (#dc2626)
- **Actions disponibles** : Aucune (état final)

## 🔄 Workflow Standard

### Workflow pour Livraison

```
1. pending → 2. confirmed → 3. preparing → 4. ready → 5. on_delivery → 6. completed
                                      ↓
                                7. cancelled (à tout moment)
                                      ↓
                                8. rejected (depuis pending)
```

### Workflow pour À Emporter

```
1. pending → 2. confirmed → 3. preparing → 4. ready → 6. completed
                                      ↓
                                7. cancelled (à tout moment)
                                      ↓
                                8. rejected (depuis pending)
```

## 📊 Filtres dans le Dashboard Admin

### Filtres disponibles :
- **Reçues** : `pending`, `confirmed`
- **En cours** : `preparing`, `ready`, `on_delivery`
- **Livrées** : `completed`
- **Annulées** : `cancelled`
- **Refusées** : `rejected`
- **Toutes** : Tous les statuts

## 🎯 Actions Admin par Statut

### Commande en attente (`pending`)
- ✅ **Confirmer** : Passe à `confirmed`
- ❌ **Refuser** : Passe à `rejected`
- 🚫 **Annuler** : Passe à `cancelled`

### Commande confirmée (`confirmed`)
- 🍳 **Commencer** : Passe à `preparing`
- 🚫 **Annuler** : Passe à `cancelled`

### Commande en préparation (`preparing`)
- ✅ **Prête** : Passe à `ready`
- 🚫 **Annuler** : Passe à `cancelled`

### Commande prête (`ready`)
- 🚚 **En livraison** : Passe à `on_delivery` (si livraison)
- ✅ **Terminer** : Passe à `completed`
- 🚫 **Annuler** : Passe à `cancelled`

### Commande en livraison (`on_delivery`)
- ✅ **Terminer** : Passe à `completed`
- 🚫 **Annuler** : Passe à `cancelled`

## 📱 Affichage Client

Le client voit les statuts de ses commandes avec les mêmes couleurs et libellés :
- **En attente** : Orange
- **Confirmée** : Bleu
- **Préparation** : Jaune
- **Prête** : Vert
- **En livraison** : Cyan
- **Livrée** : Vert foncé
- **Annulée** : Rouge
- **Refusée** : Rouge foncé

## 🔔 Notifications

Les clients sont notifiés lors des changements de statut :
- `pending` → `confirmed` : "Votre commande a été confirmée"
- `confirmed` → `preparing` : "Votre commande est en préparation"
- `preparing` → `ready` : "Votre commande est prête"
- `ready` → `on_delivery` : "Votre commande est en route"
- `on_delivery` → `completed` : "Votre commande a été livrée"
- `pending` → `rejected` : "Votre commande a été refusée"
- N'importe quel statut → `cancelled` : "Votre commande a été annulée"

## ✅ Validation

- ✅ Tous les statuts sont définis dans le modèle `Order`
- ✅ Tous les statuts sont gérés dans le controller admin
- ✅ Tous les statuts sont affichés dans le dashboard admin
- ✅ Tous les statuts sont affichés dans l'écran client
- ✅ Les actions sont contextuelles selon le statut actuel
- ✅ Les filtres incluent tous les statuts






