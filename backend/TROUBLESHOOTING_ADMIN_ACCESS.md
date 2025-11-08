# 🔧 Dépannage : Accès au Dashboard Admin

## ❌ Problème : Owner de restaurant redirigé vers l'app client

**Symptôme** : Quand un owner de restaurant (rôle `restaurant`) se connecte, il est redirigé vers l'app client au lieu du dashboard admin.

---

## 🔍 Diagnostic

### 1. Vérifier le rôle dans la base de données

```bash
node backend/scripts/list-users-and-restaurants.js
```

Ou via MySQL :
```sql
SELECT id, name, email, role FROM users WHERE email = 'owner@burgerhouse.com';
```

**Résultat attendu** : `role = 'restaurant'`

### 2. Vérifier les logs de connexion

Dans la console de l'app mobile (en mode développement), vous devriez voir :
```
[AUTH] Login réussi - User data: {...}
[AUTH] Rôle: restaurant
[AUTH] isAdmin: true
[NAV] AppNavigator - isAuthenticated: true
[NAV] AppNavigator - user: { id: 5, email: 'owner@burgerhouse.com', role: 'restaurant' }
[NAV] AppNavigator - isAdmin: true
[NAV] AppNavigator - Navigation vers: AdminNavigator
```

### 3. Vérifier la réponse de l'API

La réponse de `/api/auth/login` doit contenir :
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 5,
      "name": "Burger House Owner",
      "email": "owner@burgerhouse.com",
      "phone": "+33612345678",
      "role": "restaurant"  // ← IMPORTANT : Le rôle doit être présent
    },
    "token": "...",
    "refreshToken": "..."
  }
}
```

---

## ✅ Solutions

### Solution 1 : Se déconnecter et se reconnecter

1. **Déconnectez-vous** de l'app mobile
2. **Fermez complètement l'app** (force quit)
3. **Rouvrez l'app**
4. **Reconnectez-vous** avec `owner@burgerhouse.com` / `password123`

**Pourquoi ?** Cela permet de :
- Supprimer l'ancien token en cache
- Recharger le rôle depuis l'API
- Mettre à jour la navigation

### Solution 2 : Vider le cache AsyncStorage

Si la solution 1 ne fonctionne pas, videz le cache :

1. **Déconnectez-vous** de l'app
2. **Fermez complètement l'app**
3. **Supprimez l'app** et réinstallez-la (ou videz les données de l'app dans les paramètres)
4. **Reconnectez-vous**

### Solution 3 : Vérifier le rôle dans la base de données

Si le rôle n'est pas `restaurant`, corrigez-le :

```bash
node backend/scripts/check-and-fix-admin.js
```

Ou via MySQL :
```sql
UPDATE users SET role = 'restaurant' WHERE email = 'owner@burgerhouse.com';
```

---

## 🔍 Vérifications à Faire

### 1. Vérifier que le rôle est bien `restaurant`

```bash
node -e "const { sequelize } = require('./src/config/database'); const { User } = require('./src/models'); (async () => { await sequelize.authenticate(); const user = await User.findOne({ where: { email: 'owner@burgerhouse.com' } }); console.log('Rôle:', user?.role); await sequelize.close(); })();"
```

**Résultat attendu** : `Rôle: restaurant`

### 2. Vérifier la réponse de l'API

Testez la connexion via l'API :

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Restaurant-Id: 2" \
  -d '{"email":"owner@burgerhouse.com","password":"password123"}'
```

**Vérifiez** que la réponse contient `"role": "restaurant"`

### 3. Vérifier les logs de l'app mobile

Dans la console de l'app mobile, vérifiez les logs :
- `[AUTH] Login réussi` : Le rôle doit être `restaurant`
- `[NAV] AppNavigator - isAdmin` : Doit être `true`
- `[NAV] AppNavigator - Navigation vers` : Doit être `AdminNavigator`

---

## 🐛 Problèmes Courants

### Problème 1 : Rôle incorrect dans la base de données

**Symptôme** : Le rôle est `customer` au lieu de `restaurant`

**Solution** :
```bash
node backend/scripts/create-restaurant-owner.js "Burger House Owner" "owner@burgerhouse.com" "password123" 2 --use-existing
```

### Problème 2 : Token en cache avec ancien rôle

**Symptôme** : L'utilisateur a un ancien token avec un rôle différent

**Solution** : Se déconnecter et se reconnecter (voir Solution 1)

### Problème 3 : Rôle non retourné par l'API

**Symptôme** : La réponse de l'API ne contient pas le rôle

**Solution** : Vérifier que le contrôleur `auth.controller.js` retourne bien le rôle (déjà corrigé)

---

## 📝 Checklist de Vérification

- [ ] Le rôle dans la base de données est `restaurant`
- [ ] La réponse de l'API contient `"role": "restaurant"`
- [ ] Les logs de l'app mobile montrent `isAdmin: true`
- [ ] La navigation se fait vers `AdminNavigator` et non `RootStack`
- [ ] L'utilisateur s'est déconnecté et reconnecté après la correction

---

## 🔧 Corrections Apportées

1. ✅ **AppNavigator.js** : Vérifie maintenant `user?.role === 'admin' || user?.role === 'restaurant'`
2. ✅ **NotificationContext.js** : Inclut le rôle `restaurant` pour les notifications admin
3. ✅ **AuthContext.js** : Ajout de logs de debug et rechargement du profil après connexion
4. ✅ **Backend** : Les routes admin acceptent déjà les rôles `restaurant` et `admin`

---

**Dernière mise à jour** : 2025-01-05


