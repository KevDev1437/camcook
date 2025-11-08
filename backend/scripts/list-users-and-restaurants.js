/**
 * Script pour lister tous les utilisateurs et leurs restaurants associés
 * 
 * Usage: node backend/scripts/list-users-and-restaurants.js
 */

const { sequelize } = require('../src/config/database');
const { User, Restaurant } = require('../src/models/index');

async function listUsersAndRestaurants() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        // Récupérer tous les utilisateurs
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'isActive'],
            order: [['id', 'ASC']]
        });

        // Récupérer tous les restaurants avec leurs owners
        const restaurants = await Restaurant.findAll({
            attributes: ['id', 'name', 'email', 'ownerId', 'isActive', 'subscriptionStatus'],
            include: [{
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'email', 'role'],
                required: false
            }],
            order: [['id', 'ASC']]
        });

        console.log('='.repeat(80));
        console.log('👥 UTILISATEURS');
        console.log('='.repeat(80));
        
        if (users.length === 0) {
            console.log('   Aucun utilisateur trouvé\n');
        } else {
            users.forEach(user => {
                const roleIcon = user.role === 'admin' ? '🔑' : user.role === 'restaurant' ? '🏪' : '👤';
                const statusIcon = user.isActive ? '✅' : '❌';
                console.log(`   ${roleIcon} ${statusIcon} ID: ${user.id} | ${user.name} | ${user.email} | Rôle: ${user.role}`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('🏪 RESTAURANTS');
        console.log('='.repeat(80));

        if (restaurants.length === 0) {
            console.log('   Aucun restaurant trouvé\n');
        } else {
            restaurants.forEach(restaurant => {
                const statusIcon = restaurant.isActive ? '✅' : '❌';
                const owner = restaurant.owner;
                const ownerInfo = owner 
                    ? `${owner.name} (${owner.email})`
                    : `❌ Owner ID ${restaurant.ownerId} introuvable`;
                
                console.log(`   ${statusIcon} ID: ${restaurant.id} | ${restaurant.name}`);
                console.log(`      Email: ${restaurant.email}`);
                console.log(`      Owner: ${ownerInfo}`);
                console.log(`      Subscription: ${restaurant.subscriptionStatus || 'N/A'}`);
                console.log('');
            });
        }

        // Résumé
        console.log('='.repeat(80));
        console.log('📊 RÉSUMÉ');
        console.log('='.repeat(80));
        console.log(`   Total utilisateurs : ${users.length}`);
        console.log(`   - Admins : ${users.filter(u => u.role === 'admin').length}`);
        console.log(`   - Restaurants : ${users.filter(u => u.role === 'restaurant').length}`);
        console.log(`   - Customers : ${users.filter(u => u.role === 'customer').length}`);
        console.log(`   Total restaurants : ${restaurants.length}`);
        console.log(`   - Actifs : ${restaurants.filter(r => r.isActive).length}`);
        console.log(`   - Inactifs : ${restaurants.filter(r => !r.isActive).length}`);
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    listUsersAndRestaurants();
}

module.exports = { listUsersAndRestaurants };


