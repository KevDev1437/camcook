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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
