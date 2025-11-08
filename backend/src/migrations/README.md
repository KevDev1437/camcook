# 🔄 Migrations Sequelize - Guide d'utilisation

Ce dossier contient les migrations Sequelize pour la transformation de CamCook en SaaS multi-tenant.

## 📋 Migration disponible

### `20251105192831-add-multi-tenant-support.js`

Cette migration transforme l'application CamCook en SaaS White Label en ajoutant le support multi-tenant.

#### Modifications apportées :

1. **Ajout de champs SaaS au modèle Restaurant** :
   - `slug` (STRING, unique) : Pour les URLs personnalisées (ex: "burger-house")
   - `subdomain` (STRING, unique, nullable) : Pour les sous-domaines personnalisés
   - `settings` (JSON) : Configurations personnalisées (couleurs, fonts, etc.)
   - `subscriptionPlan` (ENUM: 'free', 'starter', 'pro', 'enterprise')
   - `subscriptionStatus` (ENUM: 'active', 'inactive', 'trial', 'cancelled')
   - `subscriptionStartDate` (DATE, nullable)
   - `subscriptionEndDate` (DATE, nullable)

2. **Ajout de `restaurantId` aux modèles** :
   - `Accompaniment` : Ajout de `restaurantId` avec foreignKey vers Restaurant
   - `Drink` : Ajout de `restaurantId` avec foreignKey vers Restaurant
   - `ContactMessage` : Ajout de `restaurantId` avec foreignKey vers Restaurant

3. **Migration des données existantes** :
   - Toutes les données existantes sont assignées au restaurant CamCook
   - Le restaurant CamCook est identifié par son nom "CamCook"

4. **Création d'index pour la performance** :
   - Index sur `restaurantId` dans : Accompaniment, Drink, ContactMessage
   - Index unique sur `slug` dans Restaurant
   - Index unique sur `subdomain` dans Restaurant
   - Index unique composite sur `(restaurantId, name)` dans Accompaniment et Drink

## ⚠️ IMPORTANT - AVANT D'EXÉCUTER LA MIGRATION

1. **Sauvegarder votre base de données** :
   ```bash
   # Exemple avec mysqldump
   mysqldump -u root -p camcook > backup_camcook_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Tester sur une copie de la base de données** :
   - Créer une copie de la base de données de production
   - Exécuter la migration sur la copie
   - Vérifier que tout fonctionne correctement

3. **Vérifier que le restaurant CamCook existe** :
   - La migration recherche un restaurant avec `name = 'CamCook'`
   - Si le restaurant n'existe pas, la migration échouera
   - Assurez-vous que le restaurant CamCook existe dans votre base de données

## 🚀 Comment exécuter la migration

### Méthode 1 : Utiliser le script npm (recommandé)

```bash
# Exécuter la migration
npm run migrate

# Rollback la migration (en cas de problème)
npm run migrate:rollback
```

### Méthode 2 : Utiliser le script directement

```bash
# Exécuter la migration
node scripts/run-migration.js up

# Rollback la migration
node scripts/run-migration.js down
```

### Méthode 3 : Utiliser Sequelize CLI (si installé)

```bash
# Installer sequelize-cli (optionnel)
npm install --save-dev sequelize-cli

# Exécuter la migration
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo
```

## 📝 Après la migration

1. **Vérifier les données** :
   ```sql
   -- Vérifier que les données sont bien assignées au restaurant CamCook
   SELECT COUNT(*) FROM accompaniments WHERE restaurantId IS NOT NULL;
   SELECT COUNT(*) FROM drinks WHERE restaurantId IS NOT NULL;
   SELECT COUNT(*) FROM contact_messages WHERE restaurantId IS NOT NULL;
   
   -- Vérifier le slug du restaurant CamCook
   SELECT id, name, slug FROM restaurants WHERE name = 'CamCook';
   ```

2. **Mettre à jour les modèles Sequelize** :
   - Mettre à jour `backend/src/models/Accompaniment.js`
   - Mettre à jour `backend/src/models/Drink.js`
   - Mettre à jour `backend/src/models/ContactMessage.js`
   - Mettre à jour `backend/src/models/Restaurant.js`
   - Mettre à jour `backend/src/models/index.js` pour les associations

## 🔄 Rollback

Si vous devez annuler la migration :

```bash
npm run migrate:rollback
```

⚠️ **Attention** : Le rollback supprimera les colonnes ajoutées. Assurez-vous d'avoir une sauvegarde avant de faire un rollback.

## 📚 Structure des migrations

Les migrations Sequelize suivent cette structure :

```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    // Code pour exécuter la migration
  },
  
  async down(queryInterface, Sequelize) {
    // Code pour rollback la migration
  }
};
```

## 🐛 Dépannage

### Erreur : "Restaurant CamCook introuvable"

**Solution** : Assurez-vous qu'un restaurant avec le nom "CamCook" existe dans votre base de données :
```sql
SELECT * FROM restaurants WHERE name = 'CamCook';
```

Si le restaurant n'existe pas, créez-le ou modifiez le nom dans la migration.

### Erreur : "Duplicate entry" lors de la création d'index unique

**Solution** : Vérifiez qu'il n'y a pas de doublons dans les données :
```sql
-- Vérifier les doublons dans Accompaniment
SELECT restaurantId, name, COUNT(*) 
FROM accompaniments 
GROUP BY restaurantId, name 
HAVING COUNT(*) > 1;

-- Vérifier les doublons dans Drink
SELECT restaurantId, name, COUNT(*) 
FROM drinks 
GROUP BY restaurantId, name 
HAVING COUNT(*) > 1;
```

### Erreur : "Column already exists"

**Solution** : La migration vérifie si les colonnes existent déjà avant de les créer. Si vous obtenez cette erreur, cela signifie que la migration a déjà été exécutée partiellement. Vérifiez l'état de votre base de données.

## 📞 Support

Pour toute question ou problème, consultez la documentation Sequelize : https://sequelize.org/docs/v6/other-topics/migrations/



