/**
 * Script pour vérifier un utilisateur et prédire sa redirection
 */

const { sequelize } = require('../src/config/database');
const { User } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie\n');

    const email = process.argv[2] || 'owner@camcook.fr';
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`❌ Utilisateur ${email} non trouvé`);
      await sequelize.close();
      process.exit(1);
    }

    console.log('📋 Informations utilisateur:');
    console.log('  ID:', user.id);
    console.log('  Nom:', user.name);
    console.log('  Email:', user.email);
    console.log('  Rôle:', user.role);
    console.log('  Actif:', user.isActive);
    console.log('  defaultRestaurantId:', user.defaultRestaurantId);
    console.log('');

    console.log('🧭 Redirection attendue:');
    const isAdmin = user.role === 'superadmin' || user.role === 'adminrestaurant';
    
    if (isAdmin) {
      if (user.role === 'superadmin') {
        console.log('  ✅ → Dashboard Super Admin (AdminNavigator)');
        console.log('  📱 L\'utilisateur sera redirigé vers le dashboard super admin');
      } else {
        console.log('  ✅ → Dashboard Admin Restaurant (AdminNavigator)');
        console.log('  📱 L\'utilisateur sera redirigé vers le dashboard admin restaurant');
      }
    } else {
      console.log('  ✅ → App Client (RootStack)');
      console.log('  📱 L\'utilisateur sera redirigé vers l\'app client');
    }

    console.log('');
    console.log('📝 Logique de navigation:');
    console.log('  - isAuthenticated:', true);
    console.log('  - user.role:', user.role);
    console.log('  - isAdmin:', isAdmin);
    console.log('  - Condition: isAuthenticated && (user?.role === "superadmin" || user?.role === "adminrestaurant")');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();

