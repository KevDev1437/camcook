# Améliorations critiques du système de notifications

## 🔴 CRITIQUE - À implémenter en priorité

### 1. Séparation des notifications de messages (FILTRAGE AU NIVEAU CONTEXT)
**Problème actuel :** Les notifications de messages apparaissent dans la cloche au lieu de l'enveloppe.

**Solution proposée :**
- Modifier `NotificationContext` pour exposer deux listes séparées :
  - `notifications` : notifications générales (sans messages)
  - `messageNotifications` : notifications de messages uniquement
- Filtrer au niveau du contexte, pas seulement dans les écrans

### 2. Augmentation de la limite de notifications
**Problème actuel :** Seulement 10 notifications conservées.

**Solution proposée :**
```javascript
// Au lieu de slice(0, 10)
return sorted.slice(0, 100); // Augmenter à 100 notifications
```

### 3. Amélioration du tri par date
**Problème actuel :** Tri sur des strings formatées, peut échouer.

**Solution proposée :**
```javascript
// Ajouter un timestamp dans chaque notification
{
  id: notificationId,
  type: 'new_order',
  timestamp: Date.now(), // Ajouter ça
  time: orderCreatedAt.toLocaleTimeString(...),
  // ...
}

// Trier par timestamp
const sorted = combined.sort((a, b) => {
  return (b.timestamp || 0) - (a.timestamp || 0);
});
```

### 4. Réduction du polling interval
**Problème actuel :** Vérification toutes les 12 secondes.

**Solution proposée :**
```javascript
// Réduire à 5-8 secondes pour un meilleur temps réel
const id = setInterval(fetchNotifications, 5000);
```

### 5. Extension de la fenêtre de temps
**Problème actuel :** Seulement 15 minutes pour les nouvelles notifications.

**Solution proposée :**
- Augmenter à 24 heures pour les notifications non lues
- Utiliser un système de "dernière vue" plutôt que juste le temps

## 🟡 IMPORTANT - À implémenter ensuite

### 6. Notifications push natives
- Intégrer `expo-notifications`
- Permettre les notifications même quand l'app est fermée

### 7. Système de priorité
```javascript
{
  priority: 'high' | 'medium' | 'low',
  // ...
}
```

### 8. Notifications groupées
- Grouper les notifications similaires
- Ex: "3 nouvelles commandes" au lieu de 3 notifications séparées

### 9. Optimisation AsyncStorage
- Sauvegarder seulement lors de changements importants
- Pas toutes les 5 secondes

### 10. Gestion des erreurs réseau
- Retry automatique avec backoff exponentiel
- Afficher un message si le service est indisponible

## 📋 Checklist d'implémentation

- [ ] **CRITIQUE 1** : Filtrer les messages au niveau du contexte
- [ ] **CRITIQUE 2** : Augmenter la limite à 100 notifications
- [ ] **CRITIQUE 3** : Ajouter un champ `timestamp` et trier dessus
- [ ] **CRITIQUE 4** : Réduire le polling à 5 secondes
- [ ] **CRITIQUE 5** : Étendre la fenêtre à 24h pour les non lues
- [ ] **IMPORTANT 6** : Implémenter les notifications push natives
- [ ] **IMPORTANT 7** : Ajouter un système de priorité
- [ ] **IMPORTANT 8** : Grouper les notifications similaires
- [ ] **IMPORTANT 9** : Optimiser la sauvegarde AsyncStorage
- [ ] **IMPORTANT 10** : Ajouter retry et gestion d'erreurs

## 🔧 Code à modifier

### NotificationContext.js
- Ligne 331 : `slice(0, 10)` → `slice(0, 100)`
- Ligne 344 : `12000` → `5000`
- Ajouter un champ `timestamp` à chaque notification
- Filtrer les messages au niveau du contexte pour les admins
- Améliorer la logique de tri

### Header.js
- Vérifier que les notifications filtrées sont bien utilisées
- Ajouter un indicateur visuel pour les notifications prioritaires





