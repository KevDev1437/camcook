# 📋 Documentation - Système d'Avis et Questions

## 📝 Vue d'ensemble

Ce document décrit l'implémentation complète du système d'avis (reviews) et de questions sur les plats dans CamCook.

## 🎯 Fonctionnalités

### 1. **Avis et Notes** ⭐
- Les utilisateurs peuvent laisser des notes (1-5 étoiles) avec un texte d'avis sur chaque plat
- **Contrainte** : Un utilisateur ne peut laisser qu'un seul avis par plat
- Les avis sont en attente de modération avant d'être publiés
- Affichage des statistiques : moyenne des notes, répartition par étoile
- Les utilisateurs peuvent modifier ou supprimer leurs avis

### 2. **Questions** ❓
- Les utilisateurs peuvent poser une seule question par plat
- Les questions restent visibles jusqu'à ce qu'elles soient répondues
- Le personnel CamCook peut répondre aux questions
- Affichage du taux de réponse

---

## 📦 Fichiers Créés

### **Frontend (React Native Expo)**

#### Écrans
- `mobile-expo/src/screens/MenuItemDetailScreen.js`
  - Affichage complet du plat avec image, descriptif, options de commande
  - Section pour les avis et notes
  - Section pour les questions
  - Formulaires interactifs

#### Composants Réutilisables
- `mobile-expo/src/components/ReviewCard.js`
  - Affichage d'une carte d'avis
  - Auteur, note, texte, date

- `mobile-expo/src/components/QuestionCard.js`
  - Affichage d'une question avec réponse (si disponible)
  - Auteur, date, question, réponse

- `mobile-expo/src/components/RatingComponent.js`
  - Composant de sélection de note (5 étoiles)
  - Feedback textuel selon la note

#### Services
- `mobile-expo/src/services/reviewService.js`
  - `createReview()` - Créer un avis
  - `getMenuItemReviews()` - Récupérer les avis d'un plat
  - `getReviewStats()` - Statistiques des avis
  - `updateReview()` - Modifier un avis
  - `deleteReview()` - Supprimer un avis

- `mobile-expo/src/services/questionService.js`
  - `createQuestion()` - Poser une question
  - `getMenuItemQuestions()` - Récupérer les questions d'un plat
  - `getQuestionStats()` - Statistiques des questions
  - `updateQuestion()` - Modifier une question
  - `deleteQuestion()` - Supprimer une question
  - `answerQuestion()` - Répondre à une question (Admin)

---

### **Backend (Node.js/Express)**

#### Modèles
- `backend/src/models/Review.js`
  ```javascript
  - id (PK)
  - menuItemId (FK)
  - userId (FK)
  - rating (1-5)
  - text
  - status (pending/approved/rejected)
  - isVerifiedPurchase
  - helpfulCount
  - timestamps (createdAt, updatedAt)
  ```

- `backend/src/models/Question.js`
  ```javascript
  - id (PK)
  - menuItemId (FK)
  - userId (FK)
  - text
  - answer
  - answeredBy (FK - User)
  - answeredAt
  - status (unanswered/answered)
  - helpfulCount
  - timestamps (createdAt, updatedAt)
  ```

#### Contrôleurs
- `backend/src/controllers/review.controller.js`
  - `createReview()` - POST /api/reviews
  - `getMenuItemReviews()` - GET /api/reviews/menu-items/:menuItemId
  - `getReview()` - GET /api/reviews/:reviewId
  - `updateReview()` - PUT /api/reviews/:reviewId
  - `deleteReview()` - DELETE /api/reviews/:reviewId
  - `getReviewStats()` - GET /api/reviews/menu-items/:menuItemId/stats

- `backend/src/controllers/question.controller.js`
  - `createQuestion()` - POST /api/questions
  - `getMenuItemQuestions()` - GET /api/questions/menu-items/:menuItemId
  - `getQuestion()` - GET /api/questions/:questionId
  - `updateQuestion()` - PUT /api/questions/:questionId
  - `deleteQuestion()` - DELETE /api/questions/:questionId
  - `answerQuestion()` - POST /api/questions/:questionId/answer
  - `getQuestionStats()` - GET /api/questions/menu-items/:menuItemId/stats

#### Routes
- `backend/src/routes/review.routes.js`
  ```
  POST   /api/reviews
  GET    /api/reviews/menu-items/:menuItemId
  GET    /api/reviews/menu-items/:menuItemId/stats
  GET    /api/reviews/:reviewId
  PUT    /api/reviews/:reviewId
  DELETE /api/reviews/:reviewId
  ```

- `backend/src/routes/question.routes.js`
  ```
  POST   /api/questions
  GET    /api/questions/menu-items/:menuItemId
  GET    /api/questions/menu-items/:menuItemId/stats
  GET    /api/questions/:questionId
  PUT    /api/questions/:questionId
  DELETE /api/questions/:questionId
  POST   /api/questions/:questionId/answer
  ```

---

## 🔌 Intégrations à Faire

### Frontend
1. Mettre à jour `MenuItemDetailScreen.js` pour intégrer les services réels :
   ```javascript
   const { reviewService } = require('../services/reviewService');
   const { questionService } = require('../services/questionService');
   ```

2. Remplacer les données simulées par les appels API

3. Tester la navigation et les formulaires

### Backend
1. Vérifier les migrations Sequelize pour créer les tables
2. Tester les endpoints avec Postman
3. Valider les associations entre modèles
4. Ajouter les contrôles d'authentification (middleware `protect`)

---

## 📊 Flux Utilisateur

### Laisser un Avis
```
1. Utilisateur clique sur "Laisser un avis"
2. Formulaire apparaît avec étoiles et texte
3. Utilisateur sélectionne une note et tape son avis
4. Clic sur "Publier"
5. Avis envoyé au serveur (status: pending)
6. Affichage du message "En attente de modération"
```

### Poser une Question
```
1. Utilisateur clique sur "Poser une question"
2. Formulaire apparaît
3. Utilisateur tape sa question
4. Clic sur "Envoyer"
5. Question envoyée au serveur
6. Affichage dans la liste des questions
```

### Répondre à une Question (Admin)
```
1. Admin reçoit notification de nouvelle question
2. Admin clique sur la question
3. Admin tape la réponse
4. Question passe de "unanswered" à "answered"
```

---

## 🔐 Sécurité

- ✅ Authentification requise pour créer/modifier/supprimer avis et questions
- ✅ Validation des données côté serveur
- ✅ Un utilisateur ne peut modifier que ses propres avis/questions
- ✅ Les avis doivent être approuvés avant publication
- ✅ Seul le personnel peut répondre aux questions

---

## 📱 Interface Utilisateur

### MenuItemDetailScreen Layout
```
┌─────────────────────────────┐
│      Image du Plat          │
├─────────────────────────────┤
│  Nom & Prix du Plat         │
│  ⭐ 4.5 (28 avis)           │
│  Description courte         │
├─────────────────────────────┤
│  ▼ Description complète     │
│  ▼ Info de cuisson          │
├─────────────────────────────┤
│  ▼ Options                  │
│    - Taille: Petit/Moyen    │
│    - Accompagnements: ☐     │
├─────────────────────────────┤
│  - Quantité: [1]            │
│  [Ajouter au panier - 12.99€│
├─────────────────────────────┤
│  ▼ Avis et Notes (28)       │
│  [✍️ Laisser un avis]       │
│  ┌─────────────────────┐    │
│  │ Jean D. ⭐⭐⭐⭐⭐ │    │
│  │ Excellent!          │    │
│  │ 2025-10-28          │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│  ▼ Questions (5)            │
│  [❓ Poser une question]    │
│  ┌─────────────────────┐    │
│  │ Pierre L. 10-25     │    │
│  │ ❓ Sans arachide?   │    │
│  │ ✅ Réponse CamCook  │    │
│  │ Non, aucune...      │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

---

## 🧪 Tests Recommandés

### Backend
- [ ] Test création d'avis (valide/invalide)
- [ ] Test contrainte "1 avis par utilisateur par plat"
- [ ] Test modification/suppression d'avis
- [ ] Test création de question
- [ ] Test réponse à une question (Admin)
- [ ] Test statistiques (avis et questions)

### Frontend
- [ ] Affichage du détail du plat
- [ ] Affichage des avis avec pagination
- [ ] Formulaire d'avis fonctionnel
- [ ] Formulaire de question fonctionnel
- [ ] Affichage des réponses
- [ ] Gestion des erreurs

---

## 📚 Références

- Modèles Sequelize: `backend/src/models/`
- Routes Express: `backend/src/routes/`
- Écrans React Native: `mobile-expo/src/screens/`
- Services API: `mobile-expo/src/services/`

---

**Status**: ✅ Implémentation complète du système
**Dernière mise à jour**: 30 Octobre 2025
