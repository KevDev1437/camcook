# 🎨 Couleurs Utilisées dans l'App Mobile

Ce document liste toutes les couleurs codées en dur dans l'application mobile de base.

## 📋 Couleurs du Thème (Configurables)

### Couleurs Principales
- **Couleur Primaire** : `#FF6B6B` (Rouge corail) - Utilisée pour les boutons, header, liens actifs
- **Couleur Secondaire** : `#4ECDC4` (Turquoise) - Utilisée pour les accents

**Fichiers de configuration :**
- `src/config/theme.js` - Système de thème centralisé
- `src/config/restaurant.config.js` - Configuration par défaut

---

## 🎨 Couleurs Codées en Dur (Non Configurables)

### Couleurs Principales Utilisées

#### Vert (Succès/Actions)
- `#22c55e` - **Vert principal** (utilisé partout pour les boutons, liens, indicateurs)
  - Utilisé dans : LoginScreen, RegisterScreen, OrdersScreen, AdminMenuScreen, AdminProfileScreen, AdminUsersScreen, RestaurantDetailScreen, PaymentScreen, HomeScreen, AdminDashboardScreen, Header, Footer, etc.
  - **Occurrences : ~150+**

#### Rouge (Erreur/Suppression)
- `theme.error` - **Rouge d'erreur** (boutons de suppression, erreurs)
  - Utilisé dans : AdminMenuScreen, AdminUsersScreen, OrdersScreen, Header, AdminDashboardScreen
- `#ff1744` - Rouge pour les badges de notification
- `#d32f2f` - Rouge foncé pour "Se déconnecter"

#### Bleu
- `#2196F3` - **Bleu Material** (boutons d'action, icônes)
  - Utilisé dans : AdminMenuScreen (bouton galerie)

#### Couleurs Neutres (Gris/Noir/Blanc)

##### Gris Foncés (Textes)
- `theme.text.primary` - **Gris foncé principal** (textes principaux)
  - Utilisé partout pour les titres et textes importants
- `theme.text.secondary` - **Gris moyen** (textes secondaires)
  - Utilisé pour les sous-titres, descriptions
- `#555` - Gris moyen-foncé
- `theme.text.tertiary` - **Gris clair** (textes tertiaires, placeholders)
  - Utilisé pour les textes désactivés, icônes secondaires
- `#888` - Gris moyen-clair

##### Gris Clair (Arrière-plans)
- `theme.background.light` - **Gris très clair** (arrière-plans de pages)
  - Utilisé dans : LoginScreen, RegisterScreen, OrdersScreen, AdminMenuScreen, AdminProfileScreen, AdminUsersScreen, HomeScreen
- `theme.background.lighter` - Gris très clair (inputs, cards)
- `#f0f0f0` - Gris clair (borders, séparateurs)
- `#f9f9f9` - Gris très clair (arrière-plans alternatifs)
- `theme.background.border` - **Gris clair** (borders, séparateurs)
  - Utilisé partout pour les bordures de cartes
- `#ddd` - Gris moyen-clair (borders)
- `#e0e0e0` - Gris clair (borders)

##### Noir/Blanc
- `#000` - Noir (icônes, ombres)
- `theme.background.white` - **Blanc** (textes sur fond coloré, arrière-plans de cartes)
  - Utilisé partout
- `#1a1a1a` - Noir très foncé (Footer background)

##### Autres Couleurs

###### Jaune/Orange (Avertissements)
- `theme.background.white3cd` - Jaune clair (banner d'avertissement)
- `#ffc107` - Jaune (borders d'avertissement)
- `#856404` - Jaune foncé (texte d'avertissement)
- `theme.background.white3e0` - Orange très clair (banner)
- `#ffb399` - Orange clair (bouton désactivé)

###### Vert (Bannières)
- `#e6fffa` - Vert très clair (banner de succès)
- `#b2f5ea` - Vert clair (borders de banner)
- `#065f46` - Vert foncé (texte de banner)

###### Bleu (Graphiques)
- `#06b6d4` - Cyan (graphiques)
- `#60a5fa` - Bleu clair (graphiques)
- `#a78bfa` - Violet clair (graphiques)

###### Autres
- `#4CAF50` - Vert Material (boutons de confirmation)
- `#ccc` - Gris clair (textes de footer)

---

## 📊 Répartition par Composant

### LoginScreen & RegisterScreen
- `theme.background.light` - Arrière-plan
- `theme.background.white` - Cartes
- `theme.text.primary` - Titres
- `theme.text.secondary` - Sous-titres, textes
- `#ddd` - Borders
- `theme.primary` - Boutons, liens

### Header
- `theme.primary` - Arrière-plan
- `theme.background.white` - Icônes, textes
- `theme.text.tertiary` - Icônes secondaires
- `theme.error` - Bouton de suppression
- `#22c55e` - Badge de notification
- `theme.text.primary` - Textes de dropdown

### Footer
- `#1a1a1a` - Arrière-plan
- `theme.primary` - Titres de sections, boutons sociaux, border top
- `theme.background.white` - Icônes
- `#ccc` - Textes de liens
- `theme.text.primary` - Border top (séparateur)
- `#888` - Copyright, version

### OrdersScreen
- `theme.background.light` - Arrière-plan
- `theme.background.white` - Cartes
- `theme.text.primary` - Titres
- `theme.text.secondary` - Textes secondaires
- `#22c55e` - Totaux, boutons, liens
- `#e6fffa` / `#b2f5ea` / `#065f46` - Banner de succès
- `theme.background.white3cd` / `#ffc107` / `#856404` - Banner d'avertissement
- `theme.error` - Erreurs

### AdminMenuScreen
- `theme.background.light` - Arrière-plan
- `theme.background.white` - Cartes
- `theme.text.primary` - Titres
- `#22c55e` - Boutons de sauvegarde
- `theme.error` - Boutons de suppression
- `#2196F3` - Bouton galerie
- `theme.text.tertiary` - Textes d'aide

### AdminProfileScreen
- `theme.background.light` - Arrière-plan
- `theme.background.white` - Cartes
- `theme.text.primary` - Titres
- `theme.text.secondary` - Textes
- `#22c55e` - Boutons principaux
- `#4CAF50` - Boutons de confirmation

### AdminUsersScreen
- `theme.background.light` - Arrière-plan
- `theme.background.white` - Cartes
- `theme.text.primary` - Titres
- `#22c55e` - Boutons actifs
- `theme.error` - Boutons de suppression

### PaymentScreen
- `#22c55e` - Icônes, borders
- `theme.text.tertiary` - Icônes secondaires
- `theme.text.primary` - Titres
- `theme.text.secondary` - Textes

### HomeScreen
- `theme.text.primary` - Titres
- `theme.text.tertiary` - Textes secondaires
- `theme.background.white` - Textes sur Hero

### AdminDashboardScreen
- `#22c55e` - Graphiques, KPIs
- `#06b6d4` - Graphiques
- `#60a5fa` - Graphiques
- `#a78bfa` - Graphiques
- `theme.error` - Erreurs, annulations

---

## 🔄 Couleurs qui Devraient Utiliser le Thème

### À Remplacer par `theme.primary`
- `#22c55e` - **Utilisé ~150+ fois** (devrait être `theme.primary`)
  - Boutons principaux
  - Liens actifs
  - Indicateurs de succès
  - Borders actives
  - Graphiques

### À Remplacer par `theme.secondary`
- `#4ECDC4` - Déjà utilisé comme couleur secondaire par défaut
- `#06b6d4` - Pourrait être remplacé par `theme.secondary` dans les graphiques

---

## 📝 Recommandations

1. **Remplacer `#22c55e` par `theme.primary`** dans tous les composants
2. **Créer des constantes** pour les couleurs neutres (gris, noir, blanc)
3. **Utiliser le système de thème** pour toutes les couleurs de marque
4. **Garder les couleurs neutres** (gris, noir, blanc) codées en dur car elles sont universelles

---

## 🎯 Priorité de Migration

### Haute Priorité
- ✅ LoginScreen (déjà fait)
- ✅ RegisterScreen (déjà fait)
- ✅ Header (déjà fait)
- ✅ Footer (déjà fait)
- ✅ AppNavigator (déjà fait)

### Moyenne Priorité
- ⚠️ OrdersScreen - Remplacer `#22c55e` par `theme.primary`
- ⚠️ AdminMenuScreen - Remplacer `#22c55e` par `theme.primary`
- ⚠️ AdminProfileScreen - Remplacer `#22c55e` par `theme.primary`
- ⚠️ AdminUsersScreen - Remplacer `#22c55e` par `theme.primary`
- ⚠️ RestaurantDetailScreen - Remplacer `#22c55e` par `theme.primary`
- ⚠️ PaymentScreen - Remplacer `#22c55e` par `theme.primary`

### Basse Priorité
- ⚠️ AdminDashboardScreen - Remplacer les couleurs de graphiques
- ⚠️ HomeScreen - Couleurs minimales
- ⚠️ Autres composants avec peu de couleurs

---

**Note :** Les couleurs `#22c55e` (vert) sont utilisées partout et devraient être remplacées par `theme.primary` pour permettre la personnalisation par restaurant.



