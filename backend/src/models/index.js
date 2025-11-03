const { sequelize } = require('../config/database');
const User = require('./User');
const Address = require('./Address');
const Restaurant = require('./Restaurant');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const Review = require('./Review');
const Question = require('./Question');
const SiteInfo = require('./SiteInfo');
const ContactMessage = require('./ContactMessage');
const Accompaniment = require('./Accompaniment');
const Drink = require('./Drink');

// Define associations

// User associations
User.hasMany(Address, {
  foreignKey: 'userId',
  as: 'addresses',
  onDelete: 'CASCADE'
});
Address.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Restaurant, {
  foreignKey: 'ownerId',
  as: 'restaurants',
  onDelete: 'CASCADE'
});
Restaurant.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

User.hasMany(Order, {
  foreignKey: 'customerId',
  as: 'orders',
  onDelete: 'CASCADE'
});
Order.belongsTo(User, {
  foreignKey: 'customerId',
  as: 'customer'
});

// Restaurant associations
Restaurant.hasMany(MenuItem, {
  foreignKey: 'restaurantId',
  as: 'menuItems',
  onDelete: 'CASCADE'
});
MenuItem.belongsTo(Restaurant, {
  foreignKey: 'restaurantId',
  as: 'restaurant'
});

Restaurant.hasMany(Order, {
  foreignKey: 'restaurantId',
  as: 'orders',
  onDelete: 'CASCADE'
});
Order.belongsTo(Restaurant, {
  foreignKey: 'restaurantId',
  as: 'restaurant'
});

// MenuItem associations - Reviews and Questions
MenuItem.hasMany(Review, {
  foreignKey: 'menuItemId',
  as: 'reviews',
  onDelete: 'CASCADE'
});
Review.belongsTo(MenuItem, {
  foreignKey: 'menuItemId',
  as: 'menuItem'
});

MenuItem.hasMany(Question, {
  foreignKey: 'menuItemId',
  as: 'questions',
  onDelete: 'CASCADE'
});
Question.belongsTo(MenuItem, {
  foreignKey: 'menuItemId',
  as: 'menuItem'
});

// User associations - Reviews and Questions
User.hasMany(Review, {
  foreignKey: 'userId',
  as: 'reviews',
  onDelete: 'CASCADE'
});
Review.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Question, {
  foreignKey: 'userId',
  as: 'questions',
  onDelete: 'CASCADE'
});
Question.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Question - Answer relationship (user who answered)
User.hasMany(Question, {
  foreignKey: 'answeredBy',
  as: 'answeredQuestions'
});
Question.belongsTo(User, {
  foreignKey: 'answeredBy',
  as: 'answerer'
});

module.exports = {
  sequelize,
  User,
  Address,
  Restaurant,
  MenuItem,
  Order,
  Review,
  Question,
  SiteInfo,
  ContactMessage,
  Accompaniment,
  Drink
};
