/**
 * Script pour générer un JWT_SECRET fort et aléatoire
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Générer un secret aléatoire de 64 caractères (32 bytes en hex)
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 JWT Secrets générés:\n');
console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);
console.log('\n📝 Copiez ces valeurs dans votre fichier .env\n');
console.log('⚠️  IMPORTANT: Ne partagez jamais ces secrets publiquement!\n');





