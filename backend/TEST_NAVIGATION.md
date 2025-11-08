# 🧪 Test Navigation Dashboard Admin

## Problème
L'utilisateur `owner@burgerhouse.com` (rôle `restaurant`) est redirigé vers l'app client au lieu du dashboard admin.

## Où voir les logs

### 1. Logs Backend (Serveur)
Les logs backend s'affichent dans le terminal où vous avez lancé `npm start` dans le dossier `backend/`.

Vous devriez voir :
```
[AUTH] ✅ Login réussi pour owner@burgerhouse.com - Rôle: restaurant
[AUTH] 📤 Réponse login pour owner@burgerhouse.com: {...}
```

### 2. Logs Frontend (App Mobile)
Les logs frontend s'affichent dans :
- **Expo Go** : Console de l'app Expo Go (appuyez sur `j` dans le terminal Expo)
- **Simulateur iOS** : Console Xcode
- **Émulateur Android** : Logcat Android Studio
- **Terminal Expo** : Les logs `console.log()` apparaissent dans le terminal où vous avez lancé `npm start` dans `mobile-expo/`

Vous devriez voir :
```
[AUTH] 🔍 Réponse complète de login: {...}
[AUTH] ✅ Login réussi
[AUTH] Rôle: restaurant
[NAV] AppNavigator - user?.role: restaurant
[NAV] AppNavigator - isAdmin: true
[NAV] AppNavigator - Navigation vers: AdminNavigator
```

## Test à effectuer

### Étape 1 : Vérifier les logs backend
1. Connectez-vous avec `owner@burgerhouse.com` / `password123`
2. Regardez les logs du serveur backend
3. Vérifiez que vous voyez :
   ```
   [AUTH] ✅ Login réussi pour owner@burgerhouse.com - Rôle: restaurant
   ```

### Étape 2 : Vérifier les logs frontend
1. Dans le terminal Expo (où vous avez lancé `npm start` dans `mobile-expo/`)
2. Connectez-vous avec `owner@burgerhouse.com` / `password123`
3. Regardez les logs dans le terminal Expo
4. Vérifiez que vous voyez les logs `[AUTH]` et `[NAV]`

### Étape 3 : Vérifier la navigation
1. Après connexion, l'app devrait rediriger vers le dashboard admin
2. Si ce n'est pas le cas, regardez les logs `[NAV]` pour voir pourquoi

## Diagnostic

### Si les logs backend montrent `Rôle: restaurant`
✅ Le backend fonctionne correctement

### Si les logs frontend montrent `Rôle: undefined`
❌ Le problème vient de la structure de la réponse API ou de l'extraction des données

### Si les logs frontend montrent `Rôle: restaurant` mais `isAdmin: false`
❌ Le problème vient de la logique de navigation

### Si les logs frontend montrent `Navigation vers: RootStack`
❌ Le problème vient de la condition `isAdmin` dans `AppNavigator.js`

## Solutions

### Solution 1 : Structure de réponse incorrecte
Si `userData` est `undefined` dans les logs frontend, modifier `AuthContext.js` ligne 65 :
```javascript
// Au lieu de :
const { user: userData, token: userToken } = response.data || {};

// Essayer :
const userData = response.data?.user || response.user;
const userToken = response.data?.token || response.token;
```

### Solution 2 : Vider le cache
Si le problème persiste, vider le cache AsyncStorage :
```javascript
// Dans l'app, exécuter :
await AsyncStorage.removeItem('user');
await AsyncStorage.removeItem('token');
```

### Solution 3 : Redémarrer l'app
1. Fermer complètement l'app mobile
2. Redémarrer l'app
3. Se reconnecter

## Fichiers modifiés
- `backend/src/controllers/auth.controller.js` : Logs de debug ajoutés
- `mobile-expo/src/context/AuthContext.js` : Logs de debug ajoutés
- `mobile-expo/src/navigation/AppNavigator.js` : Logs de navigation ajoutés


