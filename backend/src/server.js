const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { connectDB } = require('./config/database');
const { generalLimiter } = require('./middleware/rateLimiter');
const { securityLogger } = require('./middleware/securityLogger');
const { sanitizeBody, sanitizeParams, sanitizeQuery } = require('./middleware/sanitizer');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// ============================================
// SÉCURITÉ : Headers HTTP sécurisés (Helmet)
// ============================================
// Protection contre XSS, clickjacking, MIME sniffing, etc.
// Doit être appliqué AVANT les autres middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Pour permettre les images externes
}));

// Headers ajoutés par Helmet :
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security
// - Content-Security-Policy

// Initialize models
require('./models/index');

// Connect to database
connectDB();

// Middleware - CORS configuré selon l'environnement
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://votre-domaine.com'])
  : ['*']; // En développement, accepter toutes les origines
// Servir les fichiers statiques du dashboard admin
app.use('/admin', express.static('public/admin'));
app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // En développement, accepter toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // En production, vérifier que l'origine est autorisée
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Augmenter la limite de taille pour permettre l'upload d'images base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (dashboard admin)
app.use(express.static('public'));

// Route pour le dashboard admin
app.get('/admin', (req, res) => {
    res.sendFile('admin/index.html', { root: 'public' });
});

// Rate limiting global (appliqué à toutes les routes)
app.use('/api', generalLimiter);

// Logging de sécurité (appliqué à toutes les routes)
app.use('/api', securityLogger);

// Sanitization des entrées (protection XSS)
app.use('/api', sanitizeBody);
app.use('/api', sanitizeParams);
app.use('/api', sanitizeQuery);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/restaurants', require('./routes/restaurant.routes'));
app.use('/api/menus', require('./routes/menu.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/site-info', require('./routes/siteinfo.routes'));
app.use('/api/contact-messages', require('./routes/contactmessage.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/superadmin', require('./routes/superadmin.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/accompaniments', require('./routes/accompaniment.routes'));
app.use('/api/drinks', require('./routes/drink.routes'));
app.use('/api/payments', require('./routes/payment.routes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CamCook API is running' });
});

// Error handling middleware (doit être le dernier middleware)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ============================================
// VÉRIFICATION DE SÉCURITÉ : JWT Secrets
// ============================================
// Vérifie que les secrets JWT sont forts avant de démarrer le serveur
// Empêche le démarrage si les secrets sont faibles ou manquants
console.log('\n🔒 Vérification des secrets JWT...');

if (!process.env.JWT_SECRET) {
  console.error('❌ ERREUR CRITIQUE : JWT_SECRET n\'est pas défini dans .env');
  console.error('📝 Ajoutez JWT_SECRET=votre_secret_fort dans le fichier .env');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ ERREUR CRITIQUE : JWT_SECRET doit faire au moins 32 caractères');
  console.error('⚠️  Secret actuel : ' + process.env.JWT_SECRET.length + ' caractères');
  console.error('');
  console.error('💡 Générez un secret fort avec cette commande :');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error('');
  process.exit(1);
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.error('❌ ERREUR CRITIQUE : JWT_REFRESH_SECRET n\'est pas défini dans .env');
  console.error('📝 Ajoutez JWT_REFRESH_SECRET=votre_secret_fort dans le fichier .env');
  process.exit(1);
}

if (process.env.JWT_REFRESH_SECRET.length < 32) {
  console.error('❌ ERREUR CRITIQUE : JWT_REFRESH_SECRET doit faire au moins 32 caractères');
  console.error('⚠️  Secret actuel : ' + process.env.JWT_REFRESH_SECRET.length + ' caractères');
  console.error('');
  console.error('💡 Générez un secret fort avec cette commande :');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error('');
  process.exit(1);
}

// Vérifier que les secrets sont différents
if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
  console.error('❌ ERREUR CRITIQUE : JWT_SECRET et JWT_REFRESH_SECRET doivent être différents');
  process.exit(1);
}

console.log('✅ JWT_SECRET : ' + process.env.JWT_SECRET.length + ' caractères (OK)');
console.log('✅ JWT_REFRESH_SECRET : ' + process.env.JWT_REFRESH_SECRET.length + ' caractères (OK)');
console.log('✅ Secrets différents (OK)');
console.log('');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces réseau

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📱 Accessible from network: http://[VOTRE_IP]:${PORT}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/api/health`);
});

module.exports = app;
