const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'camcook',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully');

    // Sync all models with database
    // { alter: true } updates tables to match models without dropping data
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
