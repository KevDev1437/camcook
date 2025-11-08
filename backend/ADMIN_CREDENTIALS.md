# 🔐 Identifiants Super Admin - CamCook SaaS

## Identifiants par défaut

Les identifiants du super admin sont créés automatiquement par le script `seed-db.js` :

### 📧 Email
```
admin@camcook.fr
```

### 🔑 Mot de passe
```
password123
```

### 👤 Rôle
```
admin
```

## 🚀 Connexion au Dashboard Super Admin

### Via l'interface web

1. **Démarrez le serveur backend** :
   ```bash
   cd backend
   npm start
   ```

2. **Ouvrez votre navigateur** :
   ```
   http://localhost:5000/admin
   ```

3. **Connectez-vous** :
   - Email : `admin@camcook.fr`
   - Mot de passe : `password123`

### Via l'API (pour obtenir un token)

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@camcook.fr",
  "password": "password123"
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@camcook.fr",
      "role": "admin"
    }
  }
}
```

## ⚠️ IMPORTANT : Sécurité

### Changer le mot de passe par défaut

**Il est fortement recommandé de changer le mot de passe par défaut après la première connexion !**

#### Option 1 : Via l'API

```bash
PUT http://localhost:5000/api/users/profile
Authorization: Bearer <VOTRE_TOKEN>
Content-Type: application/json

{
  "password": "nouveau_mot_de_passe_securise"
}
```

#### Option 2 : Via MySQL

```sql
USE camcook;

-- Le mot de passe doit être hashé avec bcrypt
-- Utilisez un script Node.js pour générer le hash
```

#### Option 3 : Créer un nouveau compte admin

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Super Admin",
  "email": "superadmin@camcook.fr",
  "phone": "+33612345678",
  "password": "mot_de_passe_securise",
  "role": "admin"
}
```

**Note** : Vous devrez peut-être modifier le contrôleur d'authentification pour permettre la création d'utilisateurs avec le rôle `admin` lors de l'inscription.

## 🔍 Vérifier qu'un utilisateur est admin

### Via MySQL

```sql
USE camcook;

SELECT id, name, email, role FROM users WHERE role = 'admin';
```

### Via l'API

```bash
GET http://localhost:5000/api/users/me
Authorization: Bearer <VOTRE_TOKEN>
```

## 📝 Créer un nouvel utilisateur admin

### Via MySQL

```sql
USE camcook;

-- Note : Le mot de passe doit être hashé avec bcrypt
-- Utilisez un script Node.js pour générer le hash

INSERT INTO users (name, email, phone, password, role, createdAt, updatedAt)
VALUES (
  'Nouveau Admin',
  'nouveau@admin.fr',
  '+33612345678',
  '$2a$10$...', -- Hash bcrypt du mot de passe
  'admin',
  NOW(),
  NOW()
);
```

### Via script Node.js

Créez un fichier `backend/scripts/create-admin.js` :

```javascript
const { User } = require('../src/models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('votre_mot_de_passe', 10);
  
  const admin = await User.create({
    name: 'Nouveau Admin',
    email: 'nouveau@admin.fr',
    phone: '+33612345678',
    password: hashedPassword,
    role: 'admin'
  });
  
  console.log('✅ Admin créé:', admin.email);
}

createAdmin();
```

## 🛡️ Sécurité recommandée

1. **Changez le mot de passe par défaut** immédiatement
2. **Utilisez un mot de passe fort** (minimum 12 caractères, majuscules, minuscules, chiffres, symboles)
3. **Activez l'authentification à deux facteurs** (si implémenté)
4. **Limitez l'accès** au dashboard admin (IP whitelist, VPN, etc.)
5. **Surveillez les logs** d'accès au dashboard

## 📞 Support

Si vous avez oublié votre mot de passe admin :

1. Connectez-vous à MySQL
2. Vérifiez l'email de l'admin : `SELECT email FROM users WHERE role = 'admin';`
3. Réinitialisez le mot de passe via un script Node.js (voir ci-dessus)

---

**Dernière mise à jour** : 2025-01-05


