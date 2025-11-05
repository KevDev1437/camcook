# 🧪 Guide de Tests de Sécurité - CamCook

## 🔍 Tests que vous pouvez effectuer en développement

### ⚠️ **IMPORTANT : Tests uniquement sur votre environnement local**
Ces tests sont destinés à votre application de développement uniquement. Ne jamais tester sur des applications en production sans autorisation.

---

## 📋 **Checklist de Tests de Sécurité**

### 1. 🚪 **Test de Force Brute (Attaque par mot de passe)**

**Objectif** : Vérifier si un attaquant peut deviner des mots de passe

**Comment tester** :
```bash
# Créer un script de test (test-bruteforce.js)
# Tester 100 tentatives de login avec des mots de passe courants
```

**Ce que vous devez vérifier** :
- ✅ L'application bloque-t-elle après plusieurs tentatives ?
- ❌ Sans rate limiting : un attaquant peut essayer 1000+ mots de passe/seconde

**Script de test** :
```javascript
// test-bruteforce.js
const axios = require('axios');

const commonPasswords = ['123456', 'password', '12345678', 'qwerty', 'abc123'];
const email = 'test@example.com';

async function testBruteforce() {
  console.log('🧪 Test de force brute...');
  let attempts = 0;
  
  for (const password of commonPasswords) {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      console.log(`✅ Succès avec : ${password}`);
      break;
    } catch (error) {
      attempts++;
      console.log(`❌ Échec ${attempts} avec : ${password}`);
    }
  }
  
  console.log(`\n📊 Total tentatives : ${attempts}`);
  console.log('⚠️  Sans rate limiting, ces tentatives peuvent être faites rapidement');
}

testBruteforce();
```

---

### 2. 🔑 **Test d'Injection SQL**

**Objectif** : Vérifier si l'application est vulnérable aux injections SQL

**Comment tester** :
Essayez des requêtes malveillantes dans les champs de recherche :

```javascript
// Dans un champ email ou recherche, essayer :
' OR '1'='1
admin'--
'; DROP TABLE users;--
' UNION SELECT * FROM users--
```

**Ce que vous devez vérifier** :
- ✅ Avec Sequelize : ces attaques devraient échouer
- ❌ Si l'application utilise des requêtes SQL directes : vulnérable

**Test pratique** :
```javascript
// test-sql-injection.js
const axios = require('axios');

const maliciousInputs = [
  "' OR '1'='1",
  "admin'--",
  "'; DROP TABLE users;--",
  "' UNION SELECT * FROM users--"
];

async function testSQLInjection() {
  console.log('🧪 Test d\'injection SQL...');
  
  for (const input of maliciousInputs) {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: input,
        password: 'test'
      });
      console.log(`⚠️  VULNÉRABLE avec : ${input}`);
    } catch (error) {
      console.log(`✅ Sécurisé contre : ${input}`);
    }
  }
}

testSQLInjection();
```

---

### 3. 🔐 **Test de Vol de Token (CORS)**

**Objectif** : Vérifier si un site malveillant peut voler des tokens

**Comment tester** :
1. Créer une page HTML simple sur un autre serveur/port
2. Tenter de faire une requête à votre API avec un token volé

**Test pratique** :
```html
<!-- test-cors-attack.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Test CORS Attack</title>
</head>
<body>
    <h1>🧪 Test de Vol de Token</h1>
    <button onclick="stealToken()">Tenter de voler des données</button>
    <div id="result"></div>
    
    <script>
    async function stealToken() {
        const stolenToken = 'VOTRE_TOKEN_VOLE'; // Token d'un utilisateur
        
        try {
            // Tenter d'accéder à l'API avec le token volé
            const response = await fetch('http://localhost:5000/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${stolenToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            document.getElementById('result').innerHTML = 
                `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            
            if (response.ok) {
                alert('⚠️ CORS vulnérable ! Les données ont été volées');
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
    </script>
</body>
</html>
```

**Ce que vous devez vérifier** :
- ❌ Si ça fonctionne avec `origin: '*'` : VULNÉRABLE
- ✅ Si ça échoue avec origine restreinte : SÉCURISÉ

---

### 4. 🎭 **Test d'Escalade de Privilèges**

**Objectif** : Vérifier si un utilisateur normal peut devenir admin

**Comment tester** :
```javascript
// test-privilege-escalation.js
const axios = require('axios');

async function testPrivilegeEscalation() {
  // 1. Se connecter en tant qu'utilisateur normal
  const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'user@example.com',
    password: 'password123'
  });
  
  const token = loginResponse.data.data.token;
  
  // 2. Tenter de modifier son rôle en admin
  try {
    const response = await axios.put('http://localhost:5000/api/users/profile', {
      role: 'admin' // Tenter de se promouvoir admin
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('⚠️ VULNÉRABLE : L\'utilisateur peut modifier son rôle');
  } catch (error) {
    console.log('✅ SÉCURISÉ : Modification de rôle bloquée');
  }
}

testPrivilegeEscalation();
```

**Ce que vous devez vérifier** :
- ✅ Le backend doit IGNORER les tentatives de modification de rôle
- ❌ Si le rôle peut être changé : VULNÉRABLE

---

### 5. 📤 **Test d'Upload de Fichiers Malveillants**

**Objectif** : Vérifier si l'application accepte des fichiers dangereux

**Comment tester** :
```javascript
// test-file-upload.js
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testFileUpload() {
  // Créer un fichier malveillant (ex: script PHP, JavaScript)
  const maliciousFile = Buffer.from('<?php system($_GET["cmd"]); ?>');
  
  const formData = new FormData();
  formData.append('image', maliciousFile, 'malicious.php');
  
  try {
    const response = await axios.put('http://localhost:5000/api/users/profile', {
      avatar: `data:image/php;base64,${maliciousFile.toString('base64')}`
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('⚠️ VULNÉRABLE : Fichier malveillant accepté');
  } catch (error) {
    console.log('✅ SÉCURISÉ : Fichier malveillant rejeté');
  }
}

testFileUpload();
```

**Ce que vous devez vérifier** :
- ✅ Validation du type MIME réel
- ✅ Vérification de l'extension
- ✅ Limite de taille
- ❌ Si des fichiers non-images sont acceptés : VULNÉRABLE

---

### 6. 🍪 **Test de Token JWT Expiré/Invalide**

**Objectif** : Vérifier si des tokens expirés ou modifiés sont rejetés

**Comment tester** :
```javascript
// test-jwt-security.js
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testJWTSecurity() {
  // 1. Token expiré
  const expiredToken = jwt.sign(
    { id: 1 }, 
    process.env.JWT_SECRET, 
    { expiresIn: '-1h' } // Expiré il y a 1 heure
  );
  
  try {
    const response = await axios.get('http://localhost:5000/api/users/profile', {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    console.log('⚠️ VULNÉRABLE : Token expiré accepté');
  } catch (error) {
    console.log('✅ SÉCURISÉ : Token expiré rejeté');
  }
  
  // 2. Token modifié
  const modifiedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_SIGNATURE';
  
  try {
    const response = await axios.get('http://localhost:5000/api/users/profile', {
      headers: { 'Authorization': `Bearer ${modifiedToken}` }
    });
    console.log('⚠️ VULNÉRABLE : Token modifié accepté');
  } catch (error) {
    console.log('✅ SÉCURISÉ : Token modifié rejeté');
  }
}

testJWTSecurity();
```

---

### 7. 📊 **Test de Rate Limiting**

**Objectif** : Vérifier si l'application limite les requêtes rapides

**Comment tester** :
```javascript
// test-rate-limiting.js
const axios = require('axios');

async function testRateLimiting() {
  console.log('🧪 Test de rate limiting...');
  const email = 'test@example.com';
  let successes = 0;
  let failures = 0;
  
  // Tenter 100 requêtes en 1 seconde
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      axios.post('http://localhost:5000/api/auth/login', {
        email,
        password: `password${i}`
      }).then(() => successes++)
      .catch(() => failures++)
    );
  }
  
  await Promise.all(promises);
  
  console.log(`✅ Succès : ${successes}`);
  console.log(`❌ Échecs : ${failures}`);
  
  if (successes > 10) {
    console.log('⚠️ VULNÉRABLE : Pas de rate limiting efficace');
  } else {
    console.log('✅ SÉCURISÉ : Rate limiting en place');
  }
}

testRateLimiting();
```

---

### 8. 🔍 **Test de Validation des Entrées**

**Objectif** : Vérifier si l'application accepte des données malformées

**Comment tester** :
```javascript
// test-input-validation.js
const axios = require('axios');

async function testInputValidation() {
  const maliciousInputs = [
    { name: '<script>alert("XSS")</script>' }, // XSS
    { email: 'not-an-email' }, // Email invalide
    { phone: 'ABC123' }, // Téléphone invalide
    { password: '123' }, // Mot de passe trop court
  ];
  
  for (const input of maliciousInputs) {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', input);
      console.log(`⚠️ VULNÉRABLE : Entrée acceptée : ${JSON.stringify(input)}`);
    } catch (error) {
      console.log(`✅ SÉCURISÉ : Entrée rejetée : ${JSON.stringify(input)}`);
    }
  }
}

testInputValidation();
```

---

## 🛠️ **Outils de Test Automatisés**

### 1. **OWASP ZAP** (Gratuit)
```bash
# Télécharger : https://www.zaproxy.org/
# Scanner automatique de vulnérabilités
```

### 2. **Burp Suite Community** (Gratuit)
```bash
# Télécharger : https://portswigger.net/burp/communitydownload
# Proxy pour intercepter et modifier les requêtes
```

### 3. **Postman - Collection de Tests**
Créer des collections Postman avec des tests automatisés

---

## 📝 **Script de Test Complet**

Créez un fichier `security-tests.js` à la racine du backend :

```javascript
// security-tests.js
const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function runAllTests() {
  console.log('🔒 Tests de Sécurité CamCook\n');
  
  // Test 1: Force brute
  await testBruteforce();
  
  // Test 2: Injection SQL
  await testSQLInjection();
  
  // Test 3: Rate limiting
  await testRateLimiting();
  
  // Test 4: Validation entrées
  await testInputValidation();
  
  console.log('\n✅ Tests terminés');
}

// Exécuter tous les tests
runAllTests();
```

---

## 🎯 **Résultats Attendus**

### ✅ **Comportement Sécurisé** :
- ❌ Force brute : Bloqué après 5 tentatives
- ✅ Injection SQL : Toutes les tentatives échouent
- ✅ CORS : Seules les origines autorisées fonctionnent
- ✅ Tokens expirés : Rejetés
- ✅ Fichiers malveillants : Rejetés
- ✅ Escalade de privilèges : Bloquée

### ⚠️ **Comportement Vulnérable** :
- ✅ Force brute : 1000+ tentatives acceptées
- ❌ Injection SQL : Certaines requêtes passent
- ❌ CORS : N'importe quel site peut accéder
- ❌ Tokens expirés : Encore valides
- ❌ Fichiers malveillants : Acceptés
- ❌ Modification de rôle : Possible

---

## 📋 **Checklist Rapide**

- [ ] Force brute bloquée ?
- [ ] Injection SQL protégée ?
- [ ] CORS restreint en production ?
- [ ] Tokens expirés rejetés ?
- [ ] Fichiers malveillants bloqués ?
- [ ] Escalade de privilèges bloquée ?
- [ ] Rate limiting actif ?
- [ ] Validation des entrées stricte ?

---

## ⚠️ **Rappel Important**

Ces tests sont **UNIQUEMENT pour votre environnement de développement**. Ne jamais :
- ❌ Tester sur des applications en production
- ❌ Tester sur des applications d'autres personnes
- ❌ Partager des tokens ou données réelles

**Objectif** : Identifier et corriger les vulnérabilités AVANT la mise en production.





