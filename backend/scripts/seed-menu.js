require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { Restaurant, MenuItem, User } = require('../src/models');

const accompaniments = [
  { name: 'Plantain frit', price: 3 },
  { name: 'Baton de manioc', price: 3 },
  { name: 'Fritte de pomme', price: 3 },
  { name: 'Water fufu', price: 3 }
];

const mainDishes = [
  {
    name: 'Poulet',
    price: 15,
    description: 'Poulet savoureux préparé selon la tradition camerounaise',
    category: 'Plats',
  },
  {
    name: 'Poisson braisé',
    price: 18,
    description: 'Poisson frais braisé aux épices',
    category: 'Plats',
  },
  {
    name: 'Brochettes',
    price: 14,
    description: 'Brochettes grillées à la perfection',
    category: 'Plats',
  },
  {
    name: 'Ndolé Royale',
    price: 20,
    description: 'Plat traditionnel camerounais aux feuilles de ndolé',
    category: 'Plats',
  },
  {
    name: 'Eru Royale',
    price: 20,
    description: 'Eru traditionnel préparé avec soin',
    category: 'Plats',
  },
  {
    name: 'BHB',
    price: 13,
    description: 'Bœuf haricot banane, un classique camerounais',
    category: 'Plats',
  },
  {
    name: 'Bouillon de bœuf',
    price: 18,
    description: 'Bouillon de bœuf épicé et savoureux',
    category: 'Plats',
  },
  {
    name: 'Poulet DG',
    price: 19,
    description: 'Poulet Directeur Général, un must camerounais',
    category: 'Plats',
  },
  {
    name: 'Sauce gombo Royale',
    price: 20,
    description: 'Sauce gombo riche et onctueuse',
    category: 'Plats',
  }
];

async function seedMenu() {
  try {
    console.log('🌱 Démarrage de l\'ajout des plats CamCook...');

    // Se connecter à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Trouver ou créer le restaurant CamCook
    const [owner] = await User.findOrCreate({
      where: { email: 'restaurant@camcook.com' },
      defaults: {
        name: 'CamCook Restaurant',
        email: 'restaurant@camcook.com',
        phone: '+33123456789',
        password: 'password123',
        role: 'restaurant'
      }
    });

    const [restaurant] = await Restaurant.findOrCreate({
      where: { name: 'CamCook' },
      defaults: {
        ownerId: owner.id,
        name: 'CamCook',
        description: 'Restaurant de cuisine camerounaise authentique',
        cuisine: ['Camerounaise', 'Africaine'],
        street: '123 Rue de la Cuisine',
        city: 'Paris',
        postalCode: '75001',
        phone: '+33123456789',
        email: 'contact@camcook.com',
        hasDelivery: true,
        hasPickup: true,
        deliveryFee: 5,
        minimumOrder: 15,
        estimatedTime: 30,
        openingHours: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '22:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '12:00', close: '21:00' }
        },
        isActive: true,
        isVerified: true
      }
    });

    console.log(`✅ Restaurant "${restaurant.name}" prêt (ID: ${restaurant.id})`);

    // Supprimer les anciens plats du restaurant
    await MenuItem.destroy({ where: { restaurantId: restaurant.id } });
    console.log('🗑️  Anciens plats supprimés');

    // Ajouter les nouveaux plats avec les accompagnements en option
    let addedCount = 0;
    for (const dish of mainDishes) {
      await MenuItem.create({
        restaurantId: restaurant.id,
        name: dish.name,
        description: dish.description,
        category: dish.category,
        price: dish.price,
        options: [
          {
            name: 'Accompagnement',
            required: true,
            multiple: false,
            choices: accompaniments.map(acc => ({
              name: acc.name,
              price: acc.price
            }))
          }
        ],
        isAvailable: true,
        preparationTime: 20,
        isPopular: ['Poulet DG', 'Ndolé Royale', 'Eru Royale'].includes(dish.name),
        images: []
      });
      addedCount++;
      console.log(`  ✓ ${dish.name} - ${dish.price}€`);
    }

    console.log(`\n✅ ${addedCount} plats ajoutés avec succès!`);
    console.log('✅ 4 accompagnements disponibles pour chaque plat à 3€');
    console.log('\n🎉 Base de données prête!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des plats:', error);
    process.exit(1);
  }
}

seedMenu();
