/**
 * Script pour vérifier les rôles des utilisateurs après la migration
 */

const { sequelize } = require('../src/config/database');
const { User } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie\n');

    const users = await User.findAll({ 
      attributes: ['id', 'email', 'role', 'name'],
      order: [['id', 'ASC']]
    });

    console.log('📋 Utilisateurs dans la base de données:');
    console.log('─'.repeat(60));
    users.forEach(u => {
      const role = u.role || 'VIDE';
      console.log(`  ${u.id}. ${u.email} (${u.name})`);
      console.log(`     Rôle: ${role}`);
      console.log('');
    });

    console.log('─'.repeat(60));
    console.log(`Total: ${users.length} utilisateur(s)`);

    await sequelize.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
})();


