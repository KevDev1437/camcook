/**
 * Script pour créer le restaurant "Burger House" avec l'ID 5
 * 
 * IMPORTANT : Ce script doit être exécuté après avoir :
 * 1. Vérifié qu'il n'y a pas déjà de restaurant avec l'ID 5
 * 2. Vérifié qu'un utilisateur avec ownerId existe (remplacer ownerId ci-dessous)
 * 
 * Usage: node backend/scripts/create-restaurant-burger-house.js
 */

const { Restaurant, User, sequelize } = require('../src/models');
require('../src/models/index'); // Initialiser les associations

async function createBurgerHouse() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Vérifier qu'un utilisateur existe pour être owner (remplacer par un ID existant)
    const ownerId = 1; // ⚠️ REMPLACER PAR UN ID D'UTILISATEUR EXISTANT
    const owner = await User.findByPk(ownerId);
    
    if (!owner) {
      console.error(`❌ Erreur : Aucun utilisateur avec l'ID ${ownerId} trouvé`);
      console.log('💡 Créez d\'abord un utilisateur ou utilisez un ID existant');
      process.exit(1);
    }

    console.log(`✅ Owner trouvé : ${owner.name} (${owner.email})`);

    // Vérifier si le restaurant avec l'ID 5 existe déjà
    const existingRestaurant = await Restaurant.findByPk(5);
    if (existingRestaurant) {
      console.log(`⚠️  Un restaurant avec l'ID 5 existe déjà : ${existingRestaurant.name}`);
      console.log('💡 Utilisez cet ID dans votre app ou créez un autre restaurant');
      process.exit(0);
    }

    // Vérifier si un restaurant "Burger House" existe déjà
    const existingByName = await Restaurant.findOne({ where: { name: 'Burger House' } });
    if (existingByName) {
      console.log(`⚠️  Un restaurant "Burger House" existe déjà avec l'ID ${existingByName.id}`);
      console.log(`💡 Mettez à jour restaurant.config.js pour utiliser l'ID ${existingByName.id}`);
      process.exit(0);
    }

    // Générer le slug
    const slug = 'burger-house';

    // Vérifier si le slug existe déjà
    const existingSlug = await Restaurant.findOne({ where: { slug } });
    if (existingSlug) {
      console.log(`⚠️  Le slug "burger-house" est déjà utilisé par le restaurant ID ${existingSlug.id}`);
    }

    // Créer le restaurant
    console.log('📝 Création du restaurant "Burger House"...');
    
    // Note : L'ID sera auto-généré, on ne peut pas forcer l'ID 5 directement
    // Si vous avez besoin de l'ID 5 exactement, vous devrez :
    // 1. Vérifier que les IDs 1-4 existent déjà
    // 2. Ou insérer manuellement avec l'ID 5
    
    const restaurant = await Restaurant.create({
      ownerId,
      name: 'Burger House',
      email: 'contact@burgerhouse.com',
      phone: '+33123456789',
      street: '123 Rue de la Gastronomie',
      city: 'Paris',
      postalCode: '75001',
      description: 'Restaurant de burgers de qualité - App White Label',
      subscriptionPlan: 'starter',
      subscriptionStatus: 'trial',
      subscriptionStartDate: new Date(),
      slug: slug,
      isActive: true,
      hasPickup: true,
      hasDelivery: true,
      deliveryFee: 2.5,
      minimumOrder: 10.0,
      estimatedTime: 30
    });

    console.log(`✅ Restaurant créé avec succès !`);
    console.log(`   - ID : ${restaurant.id}`);
    console.log(`   - Nom : ${restaurant.name}`);
    console.log(`   - Slug : ${restaurant.slug}`);
    console.log(`   - Email : ${restaurant.email}`);
    console.log(`   - Subscription : ${restaurant.subscriptionPlan} (${restaurant.subscriptionStatus})`);

    if (restaurant.id !== 5) {
      console.log('');
      console.log(`⚠️  ATTENTION : Le restaurant a été créé avec l'ID ${restaurant.id} au lieu de 5`);
      console.log(`💡 Mettez à jour clients/burger-house-app/src/config/restaurant.config.js :`);
      console.log(`   export const RESTAURANT_ID = ${restaurant.id};`);
    } else {
      console.log('');
      console.log('✅ Parfait ! Le restaurant a l\'ID 5 comme prévu.');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création du restaurant:', error);
    await sequelize.close();
    process.exit(1);
  }
}

createBurgerHouse();



