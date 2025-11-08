/**
 * Script pour créer un utilisateur propriétaire d'un restaurant
 * 
 * Ce script :
 * 1. Crée un nouvel utilisateur avec le rôle 'restaurant'
 * 2. Optionnellement, met à jour le restaurant pour utiliser ce nouvel owner
 * 
 * Usage: node backend/scripts/create-restaurant-owner.js "Nom du Propriétaire" "email@example.com" "mot_de_passe" RESTAURANT_ID
 * 
 * Exemple:
 *   node backend/scripts/create-restaurant-owner.js "CamCook Owner" "owner@camcook.fr" "password123" 3
 *   node backend/scripts/create-restaurant-owner.js "Burger House Owner" "owner@burgerhouse.com" "password123" 5
 */

const { sequelize } = require('../src/config/database');
const { User, Restaurant } = require('../src/models/index');

async function createRestaurantOwner() {
    try {
        // Récupérer les arguments
        const args = process.argv.slice(2);
        
        if (args.length < 4) {
            console.log('❌ Usage: node create-restaurant-owner.js "Nom du Propriétaire" "email@example.com" "mot_de_passe" RESTAURANT_ID');
            console.log('');
            console.log('Exemple:');
            console.log('  node create-restaurant-owner.js "CamCook Owner" "owner@camcook.fr" "password123" 3');
            console.log('  node create-restaurant-owner.js "Burger House Owner" "owner@burgerhouse.com" "password123" 5');
            process.exit(1);
        }

        const [ownerName, ownerEmail, ownerPassword, restaurantIdStr] = args;
        const restaurantId = parseInt(restaurantIdStr, 10);

        if (isNaN(restaurantId)) {
            console.error('❌ Erreur: RESTAURANT_ID doit être un nombre');
            process.exit(1);
        }

        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ where: { email: ownerEmail } });
        if (existingUser) {
            console.log(`⚠️  Un utilisateur avec l'email ${ownerEmail} existe déjà (ID: ${existingUser.id})`);
            console.log(`   Nom: ${existingUser.name}`);
            console.log(`   Rôle: ${existingUser.role}\n`);
            
            // Si l'utilisateur existe et qu'on a l'option --use-existing, continuer
            const useExisting = process.argv.includes('--use-existing');
            if (!useExisting) {
                console.log('💡 Pour utiliser cet utilisateur existant, ajoutez --use-existing à la commande');
                console.log('   Exemple: node create-restaurant-owner.js "Nom" "email@example.com" "password" RESTAURANT_ID --use-existing');
                process.exit(0);
            }

            // Mettre à jour le rôle si nécessaire
            if (existingUser.role !== 'restaurant' && existingUser.role !== 'admin') {
                console.log(`⚠️  Mise à jour du rôle de "${existingUser.role}" à "restaurant"...`);
                await existingUser.update({ role: 'restaurant' });
            }

            // Vérifier le restaurant
            const restaurant = await Restaurant.findByPk(restaurantId);
            if (!restaurant) {
                console.error(`❌ Erreur: Aucun restaurant avec l'ID ${restaurantId} trouvé`);
                process.exit(1);
            }

            // Mettre à jour le restaurant pour utiliser cet owner
            if (restaurant.ownerId !== existingUser.id) {
                console.log(`📝 Mise à jour du restaurant "${restaurant.name}" pour utiliser cet owner...`);
                await restaurant.update({ ownerId: existingUser.id });
                console.log(`✅ Restaurant "${restaurant.name}" mis à jour avec succès !\n`);
            } else {
                console.log(`✅ Le restaurant "${restaurant.name}" utilise déjà cet owner\n`);
            }

            console.log('='.repeat(60));
            console.log('📋 INFORMATIONS DE CONNEXION');
            console.log('='.repeat(60));
            console.log(`Email    : ${existingUser.email}`);
            console.log(`Password : ${ownerPassword} (si vous voulez changer le mot de passe, utilisez reset-admin-password.js)`);
            console.log(`Rôle     : ${existingUser.role}`);
            console.log(`Restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
            console.log('='.repeat(60));

            await sequelize.close();
            process.exit(0);
        }

        // Vérifier que le restaurant existe
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            console.error(`❌ Erreur: Aucun restaurant avec l'ID ${restaurantId} trouvé`);
            process.exit(1);
        }

        console.log(`📋 Restaurant trouvé : ${restaurant.name} (ID: ${restaurant.id})\n`);

        // Créer le nouvel utilisateur
        console.log('📝 Création de l\'utilisateur propriétaire...');
        const owner = await User.create({
            name: ownerName,
            email: ownerEmail,
            phone: '+33612345678', // Téléphone par défaut, à modifier si nécessaire
            password: ownerPassword, // Le hook beforeCreate va hasher automatiquement
            role: 'restaurant'
        });

        console.log(`✅ Utilisateur créé avec succès (ID: ${owner.id})\n`);

        // Mettre à jour le restaurant pour utiliser ce nouvel owner
        console.log(`📝 Mise à jour du restaurant "${restaurant.name}" pour utiliser le nouvel owner...`);
        await restaurant.update({ ownerId: owner.id });
        console.log(`✅ Restaurant "${restaurant.name}" mis à jour avec succès !\n`);

        // Afficher les informations de connexion
        console.log('='.repeat(60));
        console.log('📋 INFORMATIONS DE CONNEXION');
        console.log('='.repeat(60));
        console.log(`Nom      : ${owner.name}`);
        console.log(`Email    : ${owner.email}`);
        console.log(`Password : ${ownerPassword}`);
        console.log(`Rôle     : ${owner.role}`);
        console.log(`Restaurant: ${restaurant.name} (ID: ${restaurant.id})`);
        console.log('='.repeat(60));
        console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants :');
        console.log(`   - Dans l'app mobile : ${restaurant.name}`);
        console.log(`   - Via l'API : POST /api/auth/login`);
        console.log('');

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    createRestaurantOwner();
}

module.exports = { createRestaurantOwner };

