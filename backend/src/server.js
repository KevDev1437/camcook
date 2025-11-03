const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Initialize models
require('./models/index');

// Connect to database
connectDB();

// Middleware - CORS configuré pour accepter toutes les origines en développement
app.use(cors({
  origin: '*', // En développement, accepter toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Augmenter la limite de taille pour permettre l'upload d'images base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/accompaniments', require('./routes/accompaniment.routes'));
app.use('/api/drinks', require('./routes/drink.routes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CamCook API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces réseau

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📱 Accessible from network: http://[VOTRE_IP]:${PORT}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/api/health`);
});

module.exports = app;
