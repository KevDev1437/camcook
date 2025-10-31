const dotenv = require('dotenv');
const { sequelize, connectDB } = require('../src/config/database');
const models = require('../src/models/index');

// Load environment variables
dotenv.config();

const initDatabase = async () => {
  try {
    console.log('🔄 Starting database initialization...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL successfully');

    // Drop all tables and recreate (WARNING: This will delete all data)
    // Use { force: true } to drop tables, { alter: true } to modify without dropping
    const FORCE_DROP = process.argv.includes('--force');

    if (FORCE_DROP) {
      console.log('⚠️  WARNING: Dropping all existing tables...');
      await sequelize.sync({ force: true });
      console.log('✅ All tables dropped and recreated');
    } else {
      console.log('🔄 Syncing database schema (alter mode)...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database schema synchronized');
    }

    console.log('\n📋 Tables created:');
    console.log('   - users');
    console.log('   - addresses');
    console.log('   - restaurants');
    console.log('   - menu_items');
    console.log('   - orders');

    console.log('\n✅ Database initialization completed!');
    console.log('\n💡 Usage:');
    console.log('   npm run init-db          # Sync schema without dropping');
    console.log('   npm run init-db --force  # Drop and recreate all tables');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

// Run initialization
initDatabase();
