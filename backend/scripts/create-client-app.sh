#!/bin/bash

###############################################################################
# Script de création d'app White Label pour clients
# 
# Ce script crée automatiquement une nouvelle app White Label pour un client
# en copiant le code source et en personnalisant les configurations.
#
# Usage: ./create-client-app.sh "Restaurant Name" RESTAURANT_ID "email@example.com" "#FF6B6B"
#
# Exemple: ./create-client-app.sh "Burger House" 5 "contact@burgerhouse.com" "#FF5733"
###############################################################################

# Ne pas utiliser set -e au début car certaines opérations peuvent échouer sans être critiques
# (comme la suppression de fichiers verrouillés sur Windows)
# On gère les erreurs manuellement pour les opérations critiques
# set -e sera activé après la validation des paramètres

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paramètres
RESTAURANT_NAME=$1
RESTAURANT_ID=$2
EMAIL=$3
PRIMARY_COLOR=${4:-"#FF6B6B"}
SECONDARY_COLOR=${5:-"#4ECDC4"}
API_URL=${6:-"http://localhost:5000/api"}
STRIPE_KEY=${7:-""}
WIFI_IP=${8:-""}

# Validation des paramètres
if [ -z "$RESTAURANT_NAME" ] || [ -z "$RESTAURANT_ID" ]; then
    echo -e "${RED}❌ Erreur: Paramètres manquants${NC}"
    echo ""
    echo "Usage: ./create-client-app.sh 'Restaurant Name' RESTAURANT_ID 'email@example.com' [PRIMARY_COLOR] [SECONDARY_COLOR]"
    echo ""
    echo "Exemple:"
    echo "  ./create-client-app.sh 'Burger House' 5 'contact@burgerhouse.com' '#FF5733' '#4ECDC4'"
    echo ""
    exit 1
fi

# Validation du Restaurant ID (doit être un nombre)
if ! [[ "$RESTAURANT_ID" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}❌ Erreur: Restaurant ID doit être un nombre${NC}"
    exit 1
fi

# Validation de l'email (format basique)
if [ -n "$EMAIL" ] && [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${YELLOW}⚠️  Avertissement: Format d'email invalide, mais continuation...${NC}"
fi

# Créer le slug (nom sans espaces, minuscules, accents supprimés)
SLUG=$(echo "$RESTAURANT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[àáâãäå]/a/g; s/[èéêë]/e/g; s/[ìíîï]/i/g; s/[òóôõö]/o/g; s/[ùúûü]/u/g; s/[ñ]/n/g; s/[ç]/c/g' | sed 's/[^a-z0-9-]//g')

# Créer le bundle ID (format iOS/Android)
BUNDLE_ID="com.camcook.$SLUG"

# Déterminer le répertoire de base (parent du dossier backend)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$BACKEND_DIR")"
MOBILE_EXPO_DIR="$PROJECT_ROOT/mobile-expo"
CLIENTS_DIR="$PROJECT_ROOT/clients"

# Vérifier que mobile-expo existe
if [ ! -d "$MOBILE_EXPO_DIR" ]; then
    echo -e "${RED}❌ Erreur: Le dossier mobile-expo n'existe pas dans: $MOBILE_EXPO_DIR${NC}"
    exit 1
fi

# Créer le dossier clients s'il n'existe pas
mkdir -p "$CLIENTS_DIR"

# Créer le dossier de l'app client
APP_DIR="$CLIENTS_DIR/${SLUG}-app"

# Vérifier si l'app existe déjà
# Si le script est exécuté depuis Node.js (non-interactif), supprimer automatiquement
# Sinon, demander confirmation
if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}⚠️  L'app existe déjà dans: $APP_DIR${NC}"
    
    # Vérifier si on est en mode non-interactif (exécuté depuis Node.js)
    if [ -t 0 ]; then
        # Mode interactif : demander confirmation
        read -p "Voulez-vous la remplacer ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}ℹ️  Opération annulée${NC}"
            exit 0
        fi
    else
        # Mode non-interactif : supprimer automatiquement
        echo -e "${BLUE}ℹ️  Mode non-interactif détecté - Suppression automatique de l'ancienne app${NC}"
    fi
    
    echo -e "${YELLOW}🗑️  Suppression de l'ancienne app...${NC}"
    
    # Désactiver set -e temporairement pour la suppression (peut échouer sur Windows)
    set +e
    
    # Suppression robuste sur Windows (plusieurs tentatives)
    # Sur Windows, certains fichiers peuvent être verrouillés, on essaie plusieurs méthodes
    if [ -d "$APP_DIR" ]; then
        # Méthode 1 : Supprimer node_modules en premier (souvent le problème)
        if [ -d "$APP_DIR/node_modules" ]; then
            echo -e "${BLUE}   Suppression de node_modules...${NC}"
            rm -rf "$APP_DIR/node_modules" 2>/dev/null || true
            # Attendre un peu pour que Windows libère les fichiers
            sleep 1
        fi
        
        # Méthode 2 : Supprimer le reste
        echo -e "${BLUE}   Suppression du reste du dossier...${NC}"
        rm -rf "$APP_DIR" 2>/dev/null || {
            # Si ça échoue, essayer avec find (plus robuste sur Windows)
            echo -e "${YELLOW}   Tentative avec méthode alternative...${NC}"
            find "$APP_DIR" -mindepth 1 -delete 2>/dev/null || true
            rmdir "$APP_DIR" 2>/dev/null || true
        }
        
        # Vérifier si le dossier existe encore
        if [ -d "$APP_DIR" ]; then
            echo -e "${YELLOW}   ⚠️  Certains fichiers n'ont pas pu être supprimés, mais on continue...${NC}"
            echo -e "${YELLOW}   ⚠️  Le script va créer l'app par-dessus (les fichiers seront remplacés)${NC}"
            # Ne pas faire échouer le script, on continue quand même
        else
            echo -e "${GREEN}   ✅ Ancienne app supprimée avec succès${NC}"
        fi
    fi
    
    # Réactiver set -e pour les opérations critiques
    set -e
fi

echo -e "${BLUE}🚀 Création de l'app White Label pour: ${GREEN}$RESTAURANT_NAME${NC}"
echo -e "   ${BLUE}Restaurant ID:${NC} $RESTAURANT_ID"
echo -e "   ${BLUE}Slug:${NC} $SLUG"
echo -e "   ${BLUE}Bundle ID:${NC} $BUNDLE_ID"
echo -e "   ${BLUE}Email:${NC} ${EMAIL:-'Non fourni'}"
echo -e "   ${BLUE}Couleur primaire:${NC} $PRIMARY_COLOR"
echo ""

# Créer le dossier de l'app
mkdir -p "$APP_DIR"

# Fonction pour copier en excluant certains dossiers/fichiers (compatible Windows/Git Bash)
copy_excluding() {
    local src="$1"
    local dest="$2"
    
    echo -e "${BLUE}   📂 Copie des fichiers...${NC}"
    
    # Créer la structure de base
    mkdir -p "$dest"
    
    # Copier tous les fichiers et dossiers (y compris les fichiers cachés)
    # Utiliser find pour copier récursivement en excluant les dossiers à ignorer
    find "$src" -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name '.git' ! -name '.expo' ! -name '.env*' ! -name '*.log' ! -name 'package-lock.json' -exec cp -r {} "$dest/" \;
    
    # Supprimer les dossiers/fichiers à exclure (au cas où ils auraient été copiés)
    echo -e "${BLUE}   🗑️  Nettoyage des fichiers exclus...${NC}"
    rm -rf "$dest/node_modules" 2>/dev/null || true
    rm -rf "$dest/.git" 2>/dev/null || true
    rm -rf "$dest/.expo" 2>/dev/null || true
    rm -f "$dest/.env"* 2>/dev/null || true
    find "$dest" -name "*.log" -type f -delete 2>/dev/null || true
    rm -f "$dest/package-lock.json" 2>/dev/null || true
}

# Copier le code source (sans node_modules et autres fichiers inutiles)
echo -e "${BLUE}📋 Copie du code source...${NC}"
copy_excluding "$MOBILE_EXPO_DIR" "$APP_DIR"

# Modifier restaurant.config.js
echo -e "${BLUE}⚙️  Configuration de restaurant.config.js...${NC}"
cat > "$APP_DIR/src/config/restaurant.config.js" << EOF
/**
 * Configuration White Label - Restaurant
 * 
 * Cette configuration identifie le restaurant de cette app.
 * Cette app est configurée pour: $RESTAURANT_NAME
 * 
 * IMPORTANT : Ne pas modifier cette configuration sans autorisation !
 */

// Restaurant ID de cette app (configuré pour $RESTAURANT_NAME)
// Peut être surchargé par variable d'environnement
export const RESTAURANT_ID = process.env.RESTAURANT_ID 
  ? parseInt(process.env.RESTAURANT_ID, 10) 
  : $RESTAURANT_ID;

// Configuration optionnelle (peut être surchargée par les données API)
export const RESTAURANT_CONFIG = {
  // ID du restaurant (OBLIGATOIRE)
  id: RESTAURANT_ID,
  
  // Nom de l'app (optionnel, sera remplacé par les données API)
  appName: process.env.RESTAURANT_NAME || '$RESTAURANT_NAME',
  
  // Couleurs du thème (optionnel, sera remplacé par restaurant.settings)
  theme: {
    primary: process.env.PRIMARY_COLOR || '$PRIMARY_COLOR',
    secondary: process.env.SECONDARY_COLOR || '$SECONDARY_COLOR',
  },
  
  // Bundle ID (pour identifier l'app)
  bundleId: process.env.BUNDLE_ID || '$BUNDLE_ID',
};

/**
 * Fonction helper pour récupérer le restaurantId
 * @returns {number} Restaurant ID
 */
export const getRestaurantId = () => RESTAURANT_ID;

/**
 * Fonction helper pour récupérer la config complète
 * @returns {Object} Configuration complète du restaurant
 */
export const getRestaurantConfig = () => RESTAURANT_CONFIG;
EOF

# Remplacer les placeholders dans restaurant.config.js
echo -e "${BLUE}⚙️  Remplacement des placeholders dans restaurant.config.js...${NC}"
# Échapper les caractères spéciaux pour sed (notamment les # dans les couleurs)
ESCAPED_PRIMARY_COLOR=$(echo "$PRIMARY_COLOR" | sed 's/#/\\#/g')
ESCAPED_SECONDARY_COLOR=$(echo "$SECONDARY_COLOR" | sed 's/#/\\#/g')
ESCAPED_RESTAURANT_NAME=$(echo "$RESTAURANT_NAME" | sed 's/"/\\"/g')

# Remplacer les placeholders (attention : les placeholders sont dans des guillemets simples dans le JS)
sed -i.bak "s|'\\\$RESTAURANT_NAME'|\"$ESCAPED_RESTAURANT_NAME\"|g" "$APP_DIR/src/config/restaurant.config.js" 2>/dev/null || sed -i '' "s|'\\\$RESTAURANT_NAME'|\"$ESCAPED_RESTAURANT_NAME\"|g" "$APP_DIR/src/config/restaurant.config.js"
sed -i.bak "s|\\\$RESTAURANT_ID|$RESTAURANT_ID|g" "$APP_DIR/src/config/restaurant.config.js" 2>/dev/null || sed -i '' "s|\\\$RESTAURANT_ID|$RESTAURANT_ID|g" "$APP_DIR/src/config/restaurant.config.js"
sed -i.bak "s|'\\\$PRIMARY_COLOR'|\"$ESCAPED_PRIMARY_COLOR\"|g" "$APP_DIR/src/config/restaurant.config.js" 2>/dev/null || sed -i '' "s|'\\\$PRIMARY_COLOR'|\"$ESCAPED_PRIMARY_COLOR\"|g" "$APP_DIR/src/config/restaurant.config.js"
sed -i.bak "s|'\\\$SECONDARY_COLOR'|\"$ESCAPED_SECONDARY_COLOR\"|g" "$APP_DIR/src/config/restaurant.config.js" 2>/dev/null || sed -i '' "s|'\\\$SECONDARY_COLOR'|\"$ESCAPED_SECONDARY_COLOR\"|g" "$APP_DIR/src/config/restaurant.config.js"
sed -i.bak "s|'\\\$BUNDLE_ID'|\"$BUNDLE_ID\"|g" "$APP_DIR/src/config/restaurant.config.js" 2>/dev/null || sed -i '' "s|'\\\$BUNDLE_ID'|\"$BUNDLE_ID\"|g" "$APP_DIR/src/config/restaurant.config.js"
rm -f "$APP_DIR/src/config/restaurant.config.js.bak" 2>/dev/null || true

# Modifier api.js pour utiliser les variables d'environnement
echo -e "${BLUE}⚙️  Configuration de api.js...${NC}"
cat > "$APP_DIR/src/config/api.js" << 'APIFILE'
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getRestaurantId } from './restaurant.config';

// API Configuration - Utilise les variables d'environnement
// L'URL de l'API peut être configurée via la variable d'environnement API_URL
const API_URL_FROM_ENV = process.env.API_URL || Constants.expoConfig?.extra?.apiUrl;

// IP WiFi locale pour le développement (optionnel)
const WIFI_IP_FROM_ENV = process.env.WIFI_IP || Constants.expoConfig?.extra?.wifiIp || '192.168.129.10';

const getApiUrl = () => {
  // Si une URL API est fournie via variable d'environnement ET qu'elle n'est pas localhost
  // (localhost ne fonctionne pas sur appareil physique ou émulateur)
  if (API_URL_FROM_ENV && !API_URL_FROM_ENV.includes('localhost')) {
    return API_URL_FROM_ENV;
  }
  
  // Détection automatique de l'environnement
  // Si on utilise Expo Go sur appareil physique
  if (Constants.appOwnership === 'expo') {
    // Utiliser l'IP WiFi si fournie, sinon utiliser la valeur par défaut
    return `http://${WIFI_IP_FROM_ENV}:5000/api`;
  }
  
  // Si émulateur Android
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api'; // Alias localhost pour Android Emulator
  }
  
  // Si iOS Simulator
  if (Platform.OS === 'ios') {
    return 'http://localhost:5000/api';
  }
  
  // Par défaut (web, etc.) - utiliser l'IP WiFi si fournie
  if (WIFI_IP_FROM_ENV) {
    return `http://${WIFI_IP_FROM_ENV}:5000/api`;
  }
  
  // Fallback : utiliser l'URL de l'environnement si disponible
  if (API_URL_FROM_ENV) {
    return API_URL_FROM_ENV;
  }
  
  // Dernier fallback
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Augmenter le timeout pour les uploads d'images
  maxContentLength: 10 * 1024 * 1024, // 10MB
  maxBodyLength: 10 * 1024 * 1024, // 10MB
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// INTERCEPTEUR DE REQUÊTE
// Ajoute automatiquement restaurantId et token
// IMPORTANT : Cet intercepteur s'exécute AVANT toute requête API
// ============================================
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Ajouter X-Restaurant-Id dans TOUTES les requêtes (MULTI-TENANT)
      // Le restaurantId vient de restaurant.config.js et est toujours disponible
      // Même si RestaurantContext n'est pas encore chargé
      const restaurantId = getRestaurantId();
      if (restaurantId) {
        config.headers['X-Restaurant-Id'] = restaurantId.toString();
      } else {
        console.warn('[API] ⚠️ Restaurant ID non configuré dans restaurant.config.js');
      }

      // 2. Ajouter le token d'authentification si disponible
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log pour debug (en développement uniquement)
      if (__DEV__) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - RestaurantId: ${restaurantId || 'NON CONFIGURÉ'}`);
      }

      return config;
    } catch (error) {
      console.error('[API] ❌ Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// INTERCEPTEUR DE RÉPONSE
// Gère les erreurs API et les erreurs multi-tenant
// ============================================
api.interceptors.response.use(
  (response) => {
    // Log de succès en développement
    if (__DEV__) {
      console.log(`[API] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const url = error.config?.url;

      // Log détaillé en développement
      if (__DEV__) {
        console.error('[API] ❌ Error Response:', {
          status,
          data,
          url,
        });
      }

      // Gestion spécifique des erreurs multi-tenant
      if (status === 400 && data?.message === 'Restaurant ID required') {
        console.error('❌ ERREUR MULTI-TENANT: Restaurant ID manquant. Vérifiez restaurant.config.js');
      } else if (status === 404 && data?.message === 'Restaurant not found') {
        console.error('❌ ERREUR MULTI-TENANT: Restaurant introuvable. Vérifiez que le restaurantId dans restaurant.config.js existe dans la base de données.');
      } else if (status === 403 && data?.message?.includes('Subscription')) {
        console.error('❌ ERREUR MULTI-TENANT: Abonnement expiré ou inactif. Contactez le support.');
      } else if (status === 403 && data?.message?.includes('inactive')) {
        console.error('❌ ERREUR MULTI-TENANT: Restaurant inactif. Contactez le support.');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('[API] ❌ Network Error:', error.message);
      console.error('⚠️ Vérifiez que le backend est démarré et accessible sur:', API_BASE_URL);
      console.error('💡 Si vous êtes sur un émulateur Android, utilisez: http://10.0.2.2:5000/api');
      console.error('💡 Si vous êtes sur un appareil physique, vérifiez votre IP WiFi dans api.js');
    } else {
      // Error setting up the request
      console.error('[API] ❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
APIFILE

# Modifier stripe.js pour utiliser les variables d'environnement
echo -e "${BLUE}⚙️  Configuration de stripe.js...${NC}"
cat > "$APP_DIR/src/config/stripe.js" << EOF
// Configuration Stripe
// IMPORTANT: Utilisez votre clé publique Stripe (publishable key)
// Vous pouvez la trouver dans votre dashboard Stripe : https://dashboard.stripe.com/apikeys
// Utilisez la clé de test (pk_test_...) pour le développement
// Utilisez la clé de production (pk_live_...) pour la production

// La clé Stripe peut être configurée via la variable d'environnement STRIPE_PUBLISHABLE_KEY
const STRIPE_KEY_FROM_ENV = process.env.STRIPE_PUBLISHABLE_KEY || 
  (typeof __DEV__ !== 'undefined' && __DEV__ 
    ? '${STRIPE_KEY:-pk_test_your_key_here}' 
    : '${STRIPE_KEY:-pk_live_your_key_here}');

export const STRIPE_PUBLISHABLE_KEY = STRIPE_KEY_FROM_ENV || 
  (__DEV__ 
    ? 'pk_test_your_key_here' // Remplacez par votre clé publique de test Stripe
    : 'pk_live_your_key_here'); // Remplacez par votre clé publique de production Stripe
EOF

# Modifier app.json
echo -e "${BLUE}⚙️  Configuration de app.json...${NC}"
# Construire la section extra avec les valeurs conditionnelles de manière sécurisée
# Utiliser une approche qui génère un JSON valide

# Créer un fichier temporaire dans le même répertoire que l'app (compatible Windows/Unix)
# Utiliser le chemin absolu pour éviter les problèmes de conversion
TEMP_JSON="$APP_DIR/app.json.tmp"

# S'assurer que le répertoire existe
mkdir -p "$APP_DIR"

# Écrire le JSON de base
cat > "$TEMP_JSON" << 'APPJSONEOF'
{
  "expo": {
    "name": "RESTAURANT_NAME_PLACEHOLDER",
    "slug": "SLUG_PLACEHOLDER",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "theme.background.whitefff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "BUNDLE_ID_PLACEHOLDER"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "theme.background.whitefff"
      },
      "edgeToEdgeEnabled": true,
      "package": "BUNDLE_ID_PLACEHOLDER"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "restaurantId": RESTAURANT_ID_PLACEHOLDER,
      "restaurantName": "RESTAURANT_NAME_PLACEHOLDER",
      "apiUrl": "API_URL_PLACEHOLDER"
    }
  }
}
APPJSONEOF

# Remplacer les placeholders de base
sed -i.bak "s/RESTAURANT_NAME_PLACEHOLDER/$RESTAURANT_NAME/g" "$TEMP_JSON" 2>/dev/null || sed -i '' "s/RESTAURANT_NAME_PLACEHOLDER/$RESTAURANT_NAME/g" "$TEMP_JSON"
sed -i.bak "s/SLUG_PLACEHOLDER/$SLUG/g" "$TEMP_JSON" 2>/dev/null || sed -i '' "s/SLUG_PLACEHOLDER/$SLUG/g" "$TEMP_JSON"
sed -i.bak "s/BUNDLE_ID_PLACEHOLDER/$BUNDLE_ID/g" "$TEMP_JSON" 2>/dev/null || sed -i '' "s/BUNDLE_ID_PLACEHOLDER/$BUNDLE_ID/g" "$TEMP_JSON"
sed -i.bak "s/RESTAURANT_ID_PLACEHOLDER/$RESTAURANT_ID/g" "$TEMP_JSON" 2>/dev/null || sed -i '' "s/RESTAURANT_ID_PLACEHOLDER/$RESTAURANT_ID/g" "$TEMP_JSON"
sed -i.bak "s|API_URL_PLACEHOLDER|$API_URL|g" "$TEMP_JSON" 2>/dev/null || sed -i '' "s|API_URL_PLACEHOLDER|$API_URL|g" "$TEMP_JSON"

# Nettoyer le fichier de backup si créé
rm -f "$TEMP_JSON.bak" 2>/dev/null || true

# Ajouter wifiIp et stripePublishableKey si fournis
# Utiliser Python ou Node.js pour manipuler le JSON de manière sûre
if command -v node >/dev/null 2>&1; then
    # Utiliser Node.js pour manipuler le JSON
    # Obtenir le chemin Windows absolu depuis Git Bash
    # Utiliser cd et pwd -W pour obtenir le chemin Windows
    APP_DIR_WIN=$(cd "$APP_DIR" && pwd -W 2>/dev/null || pwd)
    
    # Si pwd -W n'a pas fonctionné, convertir le chemin Unix en Windows
    if [[ "$APP_DIR_WIN" != *"\\"* ]] && [[ "$APP_DIR_WIN" != *":"* ]]; then
        # Convertir le chemin Unix en Windows
        # /e/Projet Pro/... -> E:\Projet Pro\...
        APP_DIR_WIN=$(echo "$APP_DIR" | sed 's|^/\([a-z]\)|\1:|' | sed 's|/|\\|g')
    fi
    
    node << NODEJS
const fs = require('fs');
const path = require('path');

// Obtenir le chemin du répertoire de l'app (Windows ou Unix)
const appDir = "$APP_DIR_WIN";
// Construire le chemin du fichier temporaire avec path.join
const jsonPath = path.join(appDir, 'app.json.tmp');

// Normaliser le chemin
const normalizedPath = path.resolve(jsonPath);

// Vérifier que le fichier existe
if (!fs.existsSync(normalizedPath)) {
    console.error('❌ Fichier introuvable:', normalizedPath);
    console.error('   Chemin original:', "$TEMP_JSON");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(normalizedPath, 'utf8'));

const wifiIp = "$WIFI_IP";
const stripeKey = "$STRIPE_KEY";

if (wifiIp && wifiIp.trim() !== "") {
    data.expo.extra.wifiIp = wifiIp;
}

if (stripeKey && stripeKey.trim() !== "") {
    data.expo.extra.stripePublishableKey = stripeKey;
}

fs.writeFileSync(normalizedPath, JSON.stringify(data, null, 2) + '\n');
NODEJS
elif command -v python3 >/dev/null 2>&1; then
    # Utiliser Python pour manipuler le JSON
    python3 << PYTHON
import json
import os

json_path = "$TEMP_JSON"
# Normaliser le chemin
json_path = os.path.normpath(json_path)

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

wifi_ip = "$WIFI_IP"
stripe_key = "$STRIPE_KEY"

if wifi_ip and wifi_ip.strip():
    data['expo']['extra']['wifiIp'] = wifi_ip

if stripe_key and stripe_key.strip():
    data['expo']['extra']['stripePublishableKey'] = stripe_key

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')
PYTHON
else
    # Fallback : utiliser sed (moins robuste mais fonctionne)
    if [ -n "$WIFI_IP" ]; then
        # Insérer wifiIp avant la dernière accolade de extra
        sed -i.bak "s|\"apiUrl\": \"$API_URL\"|\"apiUrl\": \"$API_URL\",\n      \"wifiIp\": \"$WIFI_IP\"|" "$TEMP_JSON" 2>/dev/null || sed -i '' "s|\"apiUrl\": \"$API_URL\"|\"apiUrl\": \"$API_URL\",\n      \"wifiIp\": \"$WIFI_IP\"|" "$TEMP_JSON"
        rm -f "$TEMP_JSON.bak" 2>/dev/null || true
    fi
    
    if [ -n "$STRIPE_KEY" ]; then
        # Insérer stripePublishableKey avant la dernière accolade de extra
        if [ -n "$WIFI_IP" ]; then
            sed -i.bak "s|\"wifiIp\": \"$WIFI_IP\"|\"wifiIp\": \"$WIFI_IP\",\n      \"stripePublishableKey\": \"$STRIPE_KEY\"|" "$TEMP_JSON" 2>/dev/null || sed -i '' "s|\"wifiIp\": \"$WIFI_IP\"|\"wifiIp\": \"$WIFI_IP\",\n      \"stripePublishableKey\": \"$STRIPE_KEY\"|" "$TEMP_JSON"
        else
            sed -i.bak "s|\"apiUrl\": \"$API_URL\"|\"apiUrl\": \"$API_URL\",\n      \"stripePublishableKey\": \"$STRIPE_KEY\"|" "$TEMP_JSON" 2>/dev/null || sed -i '' "s|\"apiUrl\": \"$API_URL\"|\"apiUrl\": \"$API_URL\",\n      \"stripePublishableKey\": \"$STRIPE_KEY\"|" "$TEMP_JSON"
        fi
        rm -f "$TEMP_JSON.bak" 2>/dev/null || true
    fi
fi

# Copier le fichier temporaire vers app.json
cp "$TEMP_JSON" "$APP_DIR/app.json"
rm -f "$TEMP_JSON"

# Modifier package.json
echo -e "${BLUE}⚙️  Configuration de package.json...${NC}"
# Utiliser sed pour modifier le nom dans package.json
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"name\": \"mobile-expo\"/\"name\": \"$SLUG-app\"/" "$APP_DIR/package.json"
else
    # Linux
    sed -i "s/\"name\": \"mobile-expo\"/\"name\": \"$SLUG-app\"/" "$APP_DIR/package.json"
fi

# Créer .env
echo -e "${BLUE}⚙️  Création de .env...${NC}"
cat > "$APP_DIR/.env" << EOF
# Configuration White Label - $RESTAURANT_NAME
# Généré automatiquement par create-client-app.sh
# Date: $(date +"%Y-%m-%d %H:%M:%S")

# Restaurant Configuration
RESTAURANT_ID=$RESTAURANT_ID
RESTAURANT_NAME=$RESTAURANT_NAME
PRIMARY_COLOR=$PRIMARY_COLOR
SECONDARY_COLOR=$SECONDARY_COLOR
BUNDLE_ID=$BUNDLE_ID

# Email de contact
RESTAURANT_EMAIL=${EMAIL:-'contact@example.com'}

# API Configuration
API_URL=$API_URL

# Stripe Configuration
${STRIPE_KEY:+STRIPE_PUBLISHABLE_KEY=$STRIPE_KEY}
${STRIPE_KEY:-# STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here}

# Développement local (optionnel)
${WIFI_IP:+WIFI_IP=$WIFI_IP}
EOF

# Créer .env.example
echo -e "${BLUE}⚙️  Création de .env.example...${NC}"
cat > "$APP_DIR/.env.example" << EOF
# Configuration White Label - Template
# Copiez ce fichier vers .env et remplissez les valeurs

RESTAURANT_ID=
RESTAURANT_NAME=
PRIMARY_COLOR=
SECONDARY_COLOR=
BUNDLE_ID=

RESTAURANT_EMAIL=

API_URL=http://localhost:5000/api

STRIPE_PUBLISHABLE_KEY=
EOF

# Créer .gitignore si nécessaire
if [ ! -f "$APP_DIR/.gitignore" ]; then
    echo -e "${BLUE}⚙️  Création de .gitignore...${NC}"
    cat > "$APP_DIR/.gitignore" << EOF
# Dependencies
node_modules/

# Expo
.expo/
dist/
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# Environment
.env
.env.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
build/
*.apk
*.ipa
EOF
fi

# Créer README.md personnalisé pour le client
echo -e "${BLUE}📝 Création du README...${NC}"
cat > "$APP_DIR/README.md" << EOF
# $RESTAURANT_NAME - App Mobile

Application mobile White Label pour $RESTAURANT_NAME.

## 📋 Informations de l'app

- **Restaurant ID:** $RESTAURANT_ID
- **Nom:** $RESTAURANT_NAME
- **Slug:** $SLUG
- **Bundle ID:** $BUNDLE_ID
- **Email:** ${EMAIL:-'Non configuré'}

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- Expo CLI (\`npm install -g expo-cli\`)
- Expo Go app sur votre téléphone (pour le développement)

### Étapes d'installation

1. **Installer les dépendances:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configurer les variables d'environnement:**
   \`\`\`bash
   cp .env.example .env
   # Modifier .env avec vos configurations
   \`\`\`

3. **Démarrer l'app:**
   \`\`\`bash
   npm start
   \`\`\`

4. **Scanner le QR code** avec Expo Go (iOS) ou l'app Camera (Android)

## 🏗️ Build de production

### iOS

\`\`\`bash
eas build --platform ios
\`\`\`

### Android

\`\`\`bash
eas build --platform android
\`\`\`

### Les deux plateformes

\`\`\`bash
eas build --platform all
\`\`\`

## 📱 Configuration

### Restaurant ID

Le Restaurant ID est configuré dans \`src/config/restaurant.config.js\`:
\`\`\`javascript
export const RESTAURANT_ID = $RESTAURANT_ID;
\`\`\`

### Couleurs du thème

Les couleurs peuvent être configurées dans \`src/config/restaurant.config.js\` ou via les variables d'environnement:
- \`PRIMARY_COLOR\`: $PRIMARY_COLOR
- \`SECONDARY_COLOR\`: $SECONDARY_COLOR

## 🔧 Développement

### Structure du projet

- \`src/\`: Code source de l'application
- \`src/config/\`: Configuration (API, restaurant, Stripe)
- \`src/components/\`: Composants React Native
- \`src/screens/\`: Écrans de l'application
- \`src/services/\`: Services API
- \`src/context/\`: Contextes React (Auth, Cart, etc.)

### Scripts disponibles

- \`npm start\`: Démarrer le serveur de développement Expo
- \`npm run android\`: Démarrer sur Android
- \`npm run ios\`: Démarrer sur iOS
- \`npm run web\`: Démarrer sur Web

## 📞 Support

Pour toute question ou problème, contactez le support technique.

## 📄 Licence

Application propriétaire - $RESTAURANT_NAME

---

**Généré automatiquement le:** $(date +"%Y-%m-%d %H:%M:%S")
EOF

# Créer un fichier de configuration client
echo -e "${BLUE}📝 Création du fichier de configuration client...${NC}"
cat > "$APP_DIR/CLIENT_CONFIG.md" << EOF
# Configuration Client - $RESTAURANT_NAME

## Informations du client

- **Nom du restaurant:** $RESTAURANT_NAME
- **Restaurant ID:** $RESTAURANT_ID
- **Email:** ${EMAIL:-'Non fourni'}
- **Slug:** $SLUG
- **Bundle ID:** $BUNDLE_ID
- **Couleur primaire:** $PRIMARY_COLOR
- **Couleur secondaire:** $SECONDARY_COLOR

## Date de création

$(date +"%Y-%m-%d %H:%M:%S")

## Notes

- Cette app est configurée pour le restaurant ID $RESTAURANT_ID
- Le bundle ID est: $BUNDLE_ID
- Les couleurs peuvent être modifiées dans \`src/config/restaurant.config.js\` ou via \`.env\`
EOF

echo ""
echo -e "${GREEN}✅ App créée avec succès dans: $APP_DIR${NC}"
echo ""
echo -e "${GREEN}🎉 L'app White Label est prête pour $RESTAURANT_NAME !${NC}"
echo ""
echo -e "${BLUE}📝 Fichiers importants:${NC}"
echo -e "   - ${YELLOW}src/config/restaurant.config.js${NC} - Configuration du restaurant"
echo -e "   - ${YELLOW}.env${NC} - Variables d'environnement"
echo -e "   - ${YELLOW}app.json${NC} - Configuration Expo"
echo -e "   - ${YELLOW}README.md${NC} - Documentation complète"

