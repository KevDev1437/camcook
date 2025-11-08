# Script de Nettoyage des Index - CamCook

## 🚨 Problème

Erreur MySQL : **"Trop de clefs sont définies. Maximum de 64 clefs alloué"**

Cette erreur survient lorsque trop d'index sont créés sur une ou plusieurs tables, souvent à cause de :
- Migrations multiples qui créent des index en double
- Sequelize qui crée automatiquement des index
- Foreign keys qui créent automatiquement des index
- Index composites multiples

## 🔧 Solution

Le script `fix-indexes.sql` nettoie les index en double en gardant uniquement les index essentiels :

### Index à CONSERVER :
- ✅ **PRIMARY KEY** (obligatoires)
- ✅ **FOREIGN KEY** (pour les relations)
- ✅ **UNIQUE constraints** (slug, subdomain, email)
- ✅ **Index de performance critiques** (restaurantId sur les tables multi-tenant)

### Index à SUPPRIMER :
- ❌ Index en double sur restaurantId
- ❌ Index redondants sur slug/subdomain
- ❌ Index composites dupliqués
- ❌ Index générés automatiquement par Sequelize en double

## 📋 Utilisation

### Option 1 : Via MySQL en ligne de commande

```bash
# Se connecter à MySQL
mysql -u root -p

# Utiliser la base de données
USE camcook;

# Exécuter le script
SOURCE backend/scripts/fix-indexes.sql;

# Ou directement :
mysql -u root -p camcook < backend/scripts/fix-indexes.sql
```

### Option 2 : Via script Node.js (recommandé)

```bash
# Depuis la racine du projet
cd backend
node scripts/fix-indexes.js
```

Le script Node.js est plus sûr car il :
- Fait une sauvegarde automatique
- Vérifie les index avant de les supprimer
- Affiche un rapport détaillé
- Permet de confirmer avant de supprimer

### Option 3 : Via MySQL Workbench / phpMyAdmin

1. Ouvrez MySQL Workbench ou phpMyAdmin
2. Sélectionnez la base de données `camcook`
3. Ouvrez le fichier `backend/scripts/fix-indexes.sql`
4. Exécutez le script

## ⚠️ IMPORTANT : Sauvegarde obligatoire

**AVANT d'exécuter le script, faites une sauvegarde de votre base de données :**

```bash
# Sauvegarder la base de données
mysqldump -u root -p camcook > backup_camcook_$(date +%Y%m%d_%H%M%S).sql

# Ou via Node.js
node backend/scripts/backup-db.js
```

## 🔍 Vérification avant/après

### Avant le nettoyage

```sql
-- Voir le nombre d'index par table
SELECT 
    TABLE_NAME, 
    COUNT(*) as index_count
FROM 
    information_schema.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'camcook'
GROUP BY 
    TABLE_NAME 
ORDER BY 
    index_count DESC;
```

### Après le nettoyage

Le script affiche automatiquement le nombre d'index restants par table.

## 📊 Tables concernées

- `restaurants` : slug, subdomain, ownerId
- `users` : email (unique)
- `menu_items` : restaurantId
- `orders` : restaurantId, customerId, orderNumber
- `accompaniments` : restaurantId, unique composite
- `drinks` : restaurantId, unique composite
- `contact_messages` : restaurantId
- `reviews` : menuItemId, userId
- `questions` : menuItemId, userId
- `addresses` : userId

## 🐛 Dépannage

### Erreur "Index doesn't exist"

C'est normal si l'index n'existe pas. Le script utilise `DROP INDEX IF EXISTS` qui ignore les erreurs si l'index n'existe pas.

### Erreur "Cannot drop index 'PRIMARY'"

C'est normal. Les PRIMARY KEY ne peuvent pas être supprimées. Le script ne les supprime pas.

### Erreur "Cannot drop index 'FK_name'"

Les FOREIGN KEY créent automatiquement des index. Si vous voulez les supprimer, vous devez d'abord supprimer la FOREIGN KEY elle-même.

### Erreur persiste après le nettoyage

Si vous avez encore l'erreur "Trop de clefs", vérifiez :

1. **Tables avec beaucoup de colonnes** : Certaines tables peuvent avoir trop de colonnes indexées
2. **Index composites multiples** : Réduisez le nombre d'index composites
3. **Tables de jointure** : Vérifiez les tables de jointure (many-to-many)

## 📝 Notes

- Les PRIMARY KEY créent automatiquement un index
- Les FOREIGN KEY créent automatiquement un index
- Les UNIQUE constraints créent automatiquement un index
- MySQL limite à **64 index par table**
- Certaines versions de MySQL peuvent avoir des limites différentes

## ✅ Vérification finale

Après avoir exécuté le script, vérifiez que :

1. Tous les index critiques sont présents :
   ```sql
   SHOW INDEX FROM restaurants;
   SHOW INDEX FROM menu_items;
   SHOW INDEX FROM orders;
   ```

2. Aucune table n'a plus de 64 index :
   ```sql
   SELECT 
       TABLE_NAME, 
       COUNT(*) as index_count
   FROM 
       information_schema.STATISTICS 
   WHERE 
       TABLE_SCHEMA = 'camcook'
   GROUP BY 
       TABLE_NAME 
   HAVING 
       index_count > 60
   ORDER BY 
       index_count DESC;
   ```

3. Les performances sont correctes :
   - Testez les requêtes fréquentes
   - Vérifiez que les JOIN fonctionnent toujours
   - Vérifiez que les UNIQUE constraints fonctionnent

## 🔄 Si le problème persiste

Si vous avez encore trop d'index après le nettoyage :

1. **Identifiez les tables problématiques** :
   ```sql
   SELECT TABLE_NAME, COUNT(*) as index_count
   FROM information_schema.STATISTICS 
   WHERE TABLE_SCHEMA = 'camcook'
   GROUP BY TABLE_NAME 
   HAVING index_count > 50
   ORDER BY index_count DESC;
   ```

2. **Analysez les index sur ces tables** :
   ```sql
   SHOW INDEX FROM nom_table_problematique;
   ```

3. **Supprimez manuellement les index non essentiels**

4. **Considérez la normalisation** : Si une table a trop de colonnes indexées, peut-être faut-il la normaliser

---

**Dernière mise à jour** : 2025-01-05


