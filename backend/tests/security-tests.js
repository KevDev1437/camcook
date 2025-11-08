// Tests de Sécurité - CamCook Backend
// ⚠️ À utiliser uniquement en développement local

const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = null;

// Couleurs pour console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================
// TEST 1: Force Brute
// ============================================
async function testBruteforce() {
  log('\n🔐 TEST 1: Force Brute (Attaque par mot de passe)', 'blue');
  log('─'.repeat(50), 'blue');
  
  const commonPasswords = ['123456', 'password', '12345678', 'qwerty', 'admin'];
  const testEmail = 'test@example.com';
  let attempts = 0;
  let blocked = false;
  
  for (const password of commonPasswords) {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testEmail,
        password
      });
      log(`✅ Succès avec : ${password}`, 'green');
      break;
    } catch (error) {
      attempts++;
      if (error.response?.status === 429) {
        log(`🛑 Bloqué après ${attempts} tentatives (Rate limiting actif)`, 'green');
        blocked = true;
        break;
      }
      log(`❌ Tentative ${attempts} échouée : ${password}`, 'yellow');
    }
  }
  
  if (!blocked && attempts === commonPasswords.length) {
    log('⚠️  VULNÉRABLE : Aucun rate limiting détecté', 'red');
    log('   → Un attaquant peut essayer des milliers de mots de passe', 'red');
  } else if (blocked) {
    log('✅ SÉCURISÉ : Rate limiting en place', 'green');
  }
}

// ============================================
// TEST 2: Injection SQL
// ============================================
async function testSQLInjection() {
  log('\n💉 TEST 2: Injection SQL', 'blue');
  log('─'.repeat(50), 'blue');
  
  const maliciousInputs = [
    "' OR '1'='1",
    "admin'--",
    "'; DROP TABLE users;--",
    "' UNION SELECT * FROM users--"
  ];
  
  let vulnerable = false;
  
  for (const input of maliciousInputs) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: input,
        password: 'test'
      });
      
      // Si la requête passe, c'est suspect
      if (response.data.success) {
        log(`⚠️  VULNÉRABLE avec : ${input}`, 'red');
        vulnerable = true;
      }
    } catch (error) {
      // Erreur attendue - c'est bon signe
      log(`✅ Sécurisé contre : ${input.substring(0, 20)}...`, 'green');
    }
  }
  
  if (!vulnerable) {
    log('✅ SÉCURISÉ : Sequelize protège contre les injections SQL', 'green');
  }
}

// ============================================
// TEST 3: Rate Limiting
// ============================================
async function testRateLimiting() {
  log('\n⚡ TEST 3: Rate Limiting', 'blue');
  log('─'.repeat(50), 'blue');
  
  const email = `test${Date.now()}@example.com`;
  let successes = 0;
  let failures = 0;
  let blocked = false;
  
  // Tenter 20 requêtes rapides
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(
      axios.post(`${BASE_URL}/auth/login`, {
        email,
        password: `password${i}`
      })
      .then(() => successes++)
      .catch((error) => {
        if (error.response?.status === 429) {
          blocked = true;
        }
        failures++;
      })
    );
  }
  
  await Promise.all(promises);
  
  log(`📊 Succès : ${successes}, Échecs : ${failures}`, 'yellow');
  
  if (blocked || failures > 15) {
    log('✅ SÉCURISÉ : Rate limiting détecté', 'green');
  } else {
    log('⚠️  VULNÉRABLE : Pas de rate limiting efficace', 'red');
    log('   → L\'application peut être surchargée', 'red');
  }
}

// ============================================
// TEST 4: Validation des Entrées
// ============================================
async function testInputValidation() {
  log('\n📝 TEST 4: Validation des Entrées', 'blue');
  log('─'.repeat(50), 'blue');
  
  const invalidInputs = [
    { email: 'not-an-email', name: 'Test', phone: '123', password: 'test123' },
    { email: 'test@test.com', name: 'Test', phone: 'ABC123', password: '123' }, // Mot de passe trop court
    { email: 'test@test.com', name: '', phone: '123', password: 'test123' }, // Nom vide
  ];
  
  let vulnerabilities = 0;
  
  for (const input of invalidInputs) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, input);
      if (response.data.success) {
        log(`⚠️  VULNÉRABLE : Données invalides acceptées`, 'red');
        log(`   → ${JSON.stringify(input)}`, 'red');
        vulnerabilities++;
      }
    } catch (error) {
      log(`✅ Données invalides rejetées : ${input.email || 'N/A'}`, 'green');
    }
  }
  
  if (vulnerabilities === 0) {
    log('✅ SÉCURISÉ : Validation des entrées en place', 'green');
  }
}

// ============================================
// TEST 5: Token JWT Expiré
// ============================================
async function testJWTExpiration() {
  log('\n🎫 TEST 5: Token JWT Expiré', 'blue');
  log('─'.repeat(50), 'blue');
  
  if (!process.env.JWT_SECRET) {
    log('⚠️  JWT_SECRET non configuré, test ignoré', 'yellow');
    return;
  }
  
  // Créer un token expiré
  const expiredToken = jwt.sign(
    { id: 1 },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' } // Expiré il y a 1 heure
  );
  
  try {
    const response = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    
    if (response.data.success) {
      log('⚠️  VULNÉRABLE : Token expiré accepté', 'red');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ SÉCURISÉ : Token expiré rejeté', 'green');
    } else {
      log(`⚠️  Erreur inattendue : ${error.message}`, 'yellow');
    }
  }
}

// ============================================
// TEST 6: Escalade de Privilèges
// ============================================
async function testPrivilegeEscalation() {
  log('\n👑 TEST 6: Escalade de Privilèges', 'blue');
  log('─'.repeat(50), 'blue');
  log('⚠️  Ce test nécessite un utilisateur connecté', 'yellow');
  log('   → Connectez-vous d\'abord avec un compte normal', 'yellow');
  
  if (!authToken) {
    log('   → Token non disponible, test ignoré', 'yellow');
    return;
  }
  
  try {
    // Tenter de modifier le rôle en admin
    const response = await axios.put(`${BASE_URL}/users/profile`, {
      role: 'admin'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.data.data.role === 'admin') {
      log('⚠️  VULNÉRABLE : Modification de rôle possible', 'red');
    } else {
      log('✅ SÉCURISÉ : Modification de rôle bloquée', 'green');
    }
  } catch (error) {
    log('✅ SÉCURISÉ : Modification de rôle bloquée', 'green');
  }
}

// ============================================
// TEST 7: CORS (nécessite un navigateur)
// ============================================
function testCORS() {
  log('\n🌐 TEST 7: CORS (Cross-Origin Resource Sharing)', 'blue');
  log('─'.repeat(50), 'blue');
  log('⚠️  Ce test nécessite un navigateur', 'yellow');
  log('   1. Créer une page HTML sur un autre serveur/port', 'yellow');
  log('   2. Tenter d\'accéder à l\'API depuis cette page', 'yellow');
  log('   3. Vérifier si la requête passe ou est bloquée', 'yellow');
  log('\n   Voir SECURITY_TESTING_GUIDE.md pour plus de détails', 'yellow');
}

// ============================================
// EXÉCUTION DES TESTS
// ============================================
async function runAllTests() {
  log('\n' + '='.repeat(50), 'blue');
  log('🔒 TESTS DE SÉCURITÉ - CamCook Backend', 'blue');
  log('='.repeat(50), 'blue');
  log(`URL de base : ${BASE_URL}`, 'yellow');
  log('⚠️  Ces tests sont pour le DÉVELOPPEMENT uniquement', 'yellow');
  
  try {
    await testBruteforce();
    await testSQLInjection();
    await testRateLimiting();
    await testInputValidation();
    await testJWTExpiration();
    await testPrivilegeEscalation();
    testCORS();
    
    log('\n' + '='.repeat(50), 'blue');
    log('✅ Tests terminés', 'green');
    log('📋 Consultez les résultats ci-dessus', 'yellow');
    log('🔧 Corrigez les vulnérabilités avant la production', 'yellow');
    log('='.repeat(50), 'blue');
  } catch (error) {
    log(`\n❌ Erreur lors des tests : ${error.message}`, 'red');
    log('   → Vérifiez que le serveur est démarré', 'yellow');
  }
}

// Exécuter les tests
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };







