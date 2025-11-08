# Guide : Créer un restaurant via l'API Super Admin

## Problème
L'app mobile est configurée pour utiliser le restaurant ID 5, mais ce restaurant n'existe pas encore dans la base de données.

## Solution : Créer le restaurant via l'API Super Admin

### Étape 1 : Obtenir un token d'authentification admin

1. Connectez-vous avec un compte admin via l'API :
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "votre_mot_de_passe"
}
```

2. Copiez le `token` retourné dans la réponse.

### Étape 2 : Créer le restaurant "Burger House"

```bash
POST http://localhost:5000/api/superadmin/restaurants
Authorization: Bearer <VOTRE_TOKEN_ADMIN>
Content-Type: application/json

{
  "name": "Burger House",
  "email": "contact@burgerhouse.com",
  "phone": "+33123456789",
  "street": "123 Rue de la Gastronomie",
  "city": "Paris",
  "postalCode": "75001",
  "description": "Restaurant de burgers de qualité",
  "ownerId": 1,
  "subscriptionPlan": "starter"
}
```

**Remplacez `ownerId: 1`** par l'ID d'un utilisateur existant qui sera le propriétaire du restaurant.

### Étape 3 : Vérifier que le restaurant a été créé avec l'ID 5

Si l'ID auto-généré n'est pas 5, vous avez deux options :

#### Option A : Modifier l'ID dans l'app (recommandé)
Modifiez `clients/burger-house-app/src/config/restaurant.config.js` pour utiliser le nouvel ID retourné.

#### Option B : Forcer l'ID 5 (si nécessaire)
Si vous avez absolument besoin de l'ID 5, vous pouvez :
1. Insérer manuellement dans la base de données avec l'ID 5
2. Ou modifier temporairement l'auto-increment MySQL

### Exemple avec cURL

```bash
curl -X POST http://localhost:5000/api/superadmin/restaurants \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger House",
    "email": "contact@burgerhouse.com",
    "phone": "+33123456789",
    "street": "123 Rue de la Gastronomie",
    "city": "Paris",
    "postalCode": "75001",
    "description": "Restaurant de burgers de qualité",
    "ownerId": 1,
    "subscriptionPlan": "starter"
  }'
```

### Réponse attendue

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Burger House",
    "email": "contact@burgerhouse.com",
    "slug": "burger-house",
    "subscriptionStatus": "trial",
    "subscriptionPlan": "starter",
    "isActive": true,
    "owner": {
      "id": 1,
      "name": "Nom du propriétaire",
      "email": "owner@example.com"
    }
  }
}
```

## Note importante

L'ID du restaurant est auto-incrémenté. Si vous avez déjà d'autres restaurants (ID 1, 2, 3, 4), le nouveau restaurant aura l'ID 5. Sinon, il aura l'ID suivant disponible.

Si l'ID créé n'est pas 5, modifiez simplement `restaurant.config.js` dans l'app pour utiliser le bon ID.



