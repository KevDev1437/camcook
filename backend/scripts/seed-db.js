const dotenv = require('dotenv');
const { sequelize } = require('../src/config/database');
const { User, Restaurant, MenuItem, Order, SiteInfo } = require('../src/models/index');

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // Create only admin user
    console.log('\n📝 Creating admin user...');
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@camcook.fr',
      phone: '+33612345678',
      password: 'password123',
      role: 'admin'
    });

    console.log(`✅ Created 1 user (admin)`);

    // Create only CamCook restaurant
    console.log('\n🏪 Creating CamCook restaurant...');
    const restaurant3 = await Restaurant.create({
      ownerId: admin.id,
      name: 'CamCook',
      description: 'CamCook - Cuisine maison et menus du jour',
      street: '12 Rue des Saveurs',
      city: 'Lyon',
      postalCode: '69008',
      phone: '+33 619 35 65 51',
      email: 'camcook@camcook.fr',
      cuisine: ['Africaine', 'Maison'],
      hasPickup: true,
      hasDelivery: true,
      deliveryFee: 2.50,
      minimumOrder: 10.00,
      estimatedTime: 20,
      isActive: true,
      isVerified: true
    });
    console.log(`✅ Created 1 restaurant`);

    // Create sample menu items
    console.log('\n🍽️  Creating sample menu items...');
    const commonOptions = [
      {
        id: 'accompagnements',
        name: 'Accompagnements',
        type: 'checkbox',
        choices: ['Riz', 'Plantain', 'Frites', 'Attiéké', 'Alloco', 'Salade']
      },
      {
        id: 'boisson',
        name: 'Boisson',
        type: 'radio',
        choices: ['Eau', 'Bissap', 'Soda']
      }
    ];

    await MenuItem.bulkCreate([
      { restaurantId: restaurant3.id, name: 'Poulet', description: 'Poulet braisé servi avec accompagnement', category: 'Plats', price: 15.00, isAvailable: true, preparationTime: 20, isPopular: true, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'Poisson braisé', description: 'Poisson braisé au charbon, épices maison', category: 'Plats', price: 18.00, isAvailable: true, preparationTime: 25, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'Brochettes', description: 'Brochettes grillées assorties', category: 'Plats', price: 14.00, isAvailable: true, preparationTime: 15, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'Ndolé Royale', description: 'Ndolé aux éclats de viande, version royale', category: 'Plats', price: 20.00, isAvailable: true, preparationTime: 25, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'Eru Royale', description: 'Eru généreux et viande, version royale', category: 'Plats', price: 20.00, isAvailable: true, preparationTime: 25, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'BHB', description: 'Spécialité maison BHB', category: 'Plats', price: 13.00, isAvailable: true, preparationTime: 15, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'Bouillon de bœuf', description: 'Bouillon de bœuf parfumé, légumes', category: 'Plats', price: 18.00, isAvailable: true, preparationTime: 20, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'Poulet DG', description: 'Poulet DG avec plantains, légumes', category: 'Plats', price: 19.00, isAvailable: true, preparationTime: 25, options: commonOptions },
      { restaurantId: restaurant3.id, name: 'Sauce Gombo Royale', description: 'Sauce gombo riche, version royale', category: 'Plats', price: 17.00, isAvailable: true, preparationTime: 20, options: commonOptions }
    ]);

    console.log(`✅ Created 9 menu items`);

    // Seed Site Info (Footer data)
    console.log('\nℹ️  Seeding site info (footer)...');
    await SiteInfo.destroy({ where: {} });
    await SiteInfo.create({
      phone: '+33 619 35 65 51',
      email: 'camcook@camcook.fr',
      address: 'Lyon 8 ieme arrondissement',
    });
    console.log('✅ Site info seeded');

    console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Test account:');
  console.log('   Admin: admin@camcook.fr / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
