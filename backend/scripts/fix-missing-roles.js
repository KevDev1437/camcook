/**
 * Script pour corriger les rôles manquants après la migration
 */

const { sequelize } = require('../src/config/database');
const { User } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie\n');

    // Corriger les rôles manquants
    console.log('🔧 Correction des rôles manquants...\n');

    // admin@camcook.fr → superadmin
    const admin = await User.findOne({ where: { email: 'admin@camcook.fr' } });
    if (admin && !admin.role) {
      admin.role = 'superadmin';
      await admin.save();
      console.log('✅ admin@camcook.fr → superadmin');
    }

    // owner@camcook.fr → adminrestaurant
    const ownerCamcook = await User.findOne({ where: { email: 'owner@camcook.fr' } });
    if (ownerCamcook && !ownerCamcook.role) {
      ownerCamcook.role = 'adminrestaurant';
      await ownerCamcook.save();
      console.log('✅ owner@camcook.fr → adminrestaurant');
    }

    // owner@burgerhouse.com → adminrestaurant
    const ownerBurger = await User.findOne({ where: { email: 'owner@burgerhouse.com' } });
    if (ownerBurger && !ownerBurger.role) {
      ownerBurger.role = 'adminrestaurant';
      await ownerBurger.save();
      console.log('✅ owner@burgerhouse.com → adminrestaurant');
    }

    console.log('\n✅ Correction terminée !\n');

    // Afficher tous les utilisateurs
    const users = await User.findAll({ 
      attributes: ['id', 'email', 'role', 'name'],
      order: [['id', 'ASC']]
    });

    console.log('📋 Utilisateurs après correction:');
    console.log('─'.repeat(60));
    users.forEach(u => {
      const role = u.role || 'VIDE';
      console.log(`  ${u.id}. ${u.email} (${u.name})`);
      console.log(`     Rôle: ${role}`);
      console.log('');
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();


