# 🔍 Debug Navigation - Problème Dashboard Admin

## Problème
L'utilisateur `owner@burgerhouse.com` (rôle `restaurant`) est redirigé vers l'app client au lieu du dashboard admin après connexion.

## Corrections apportées

### 1. Logs de debug ajoutés
- **AuthContext.js** : Logs complets de la réponse de login et du rôle
- **AppNavigator.js** : Logs de la décision de navigation

### 2. Vérifications ajoutées
- Vérification que `userData` est bien défini
- Vérification que le rôle est présent dans la réponse
- Logs détaillés à chaque étape

## Instructions de test

### 1. Redémarrer l'application
```bash
# Dans mobile-expo/
npm start
# Ou fermer complètement l'app et la rouvrir
```

### 2. Se connecter
- Email : `owner@burgerhouse.com`
- Password : `password123`

### 3. Observer les logs
Dans la console de l'app mobile, vous devriez voir :

```
[AUTH] 🔍 Réponse complète de login: {...}
[AUTH] ✅ Login réussi
[AUTH] User data: {...}
[AUTH] Rôle: restaurant
[AUTH] isAdmin: true
[AUTH] ✅ Rôle présent: restaurant
[NAV] ============================================
[NAV] AppNavigator - isAuthenticated: true
[NAV] AppNavigator - user: { id: 5, email: 'owner@burgerhouse.com', role: 'restaurant' }
[NAV] AppNavigator - user?.role: restaurant
[NAV] AppNavigator - isAdmin: true
[NAV] AppNavigator - Navigation vers: AdminNavigator
[NAV] ============================================
```

## Diagnostic

### Si vous voyez `Navigation vers: RootStack`
Cela signifie que `isAdmin` est `false`. Vérifiez :
1. Le rôle dans les logs : `[AUTH] Rôle: ...`
2. Si le rôle est `undefined` ou `null`, le problème vient de l'API
3. Si le rôle est `restaurant` mais `isAdmin` est `false`, le problème vient de la logique

### Si vous voyez `userData est undefined`
Cela signifie que la structure de la réponse API est incorrecte. Vérifiez :
1. La structure de la réponse dans les logs : `[AUTH] 🔍 Réponse complète de login`
2. Si `response.data` existe et contient `user`

## Solutions possibles

### Solution 1 : Structure de réponse incorrecte
Si `userData` est `undefined`, modifier `AuthContext.js` ligne 65 :
```javascript
// Au lieu de :
const { user: userData, token: userToken } = response.data || {};

// Essayer :
const userData = response.data?.user || response.user;
const userToken = response.data?.token || response.token;
```

### Solution 2 : Rôle manquant
Si le rôle est `undefined`, vérifier que l'API retourne bien le rôle dans `/auth/login`

### Solution 3 : Cache AsyncStorage
Si le problème persiste, vider le cache :
```javascript
// Dans l'app, exécuter :
await AsyncStorage.removeItem('user');
await AsyncStorage.removeItem('token');
```

## Fichiers modifiés
- `mobile-expo/src/context/AuthContext.js` : Logs de debug ajoutés
- `mobile-expo/src/navigation/AppNavigator.js` : Logs de navigation ajoutés

## Prochaines étapes
1. Tester la connexion avec les nouveaux logs
2. Partager les logs complets de la console
3. Analyser les logs pour identifier le problème exact


