/**
 * Script pour vérifier et corriger le rôle admin
 * 
 * Ce script :
 * 1. Vérifie si l'utilisateur admin existe
 * 2. Vérifie son rôle
 * 3. Corrige le rôle si nécessaire
 * 
 * Usage: node backend/scripts/check-and-fix-admin.js
 */

const { sequelize } = require('../src/config/database');
const { User } = require('../src/models/index');

async function checkAndFixAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        const adminEmail = 'admin@camcook.fr';

        // Chercher l'utilisateur admin
        let admin = await User.findOne({ where: { email: adminEmail } });

        if (!admin) {
            console.log('❌ Aucun utilisateur trouvé avec l\'email:', adminEmail);
            console.log('\n💡 Exécutez d\'abord: node scripts/reset-admin-password.js');
            process.exit(1);
        }

        console.log('📋 Utilisateur trouvé :');
        console.log(`   ID: ${admin.id}`);
        console.log(`   Nom: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Rôle actuel: ${admin.role}`);
        console.log(`   Actif: ${admin.isActive}\n`);

        // Vérifier le rôle
        if (admin.role !== 'admin') {
            console.log('⚠️  Le rôle n\'est pas "admin". Correction en cours...\n');
            
            // Mettre à jour le rôle
            await admin.update({ role: 'admin' });
            
            // Recharger l'utilisateur
            await admin.reload();
            
            console.log('✅ Rôle mis à jour à "admin"\n');
        } else {
            console.log('✅ Le rôle est déjà "admin"\n');
        }

        // Vérifier que l'utilisateur est actif
        if (!admin.isActive) {
            console.log('⚠️  L\'utilisateur est inactif. Activation en cours...\n');
            await admin.update({ isActive: true });
            await admin.reload();
            console.log('✅ Utilisateur activé\n');
        }

        // Afficher les informations finales
        console.log('='.repeat(60));
        console.log('📋 INFORMATIONS FINALES');
        console.log('='.repeat(60));
        console.log(`ID       : ${admin.id}`);
        console.log(`Nom      : ${admin.name}`);
        console.log(`Email    : ${admin.email}`);
        console.log(`Rôle     : ${admin.role}`);
        console.log(`Actif    : ${admin.isActive}`);
        console.log('='.repeat(60));
        console.log('\n💡 Vous pouvez maintenant vous connecter au dashboard :');
        console.log('   http://localhost:5000/admin');
        console.log('\n📋 Identifiants :');
        console.log('   Email    : admin@camcook.fr');
        console.log('   Password : password123\n');

        // Vérifier tous les utilisateurs admin
        console.log('📊 Liste de tous les utilisateurs admin :');
        const allAdmins = await User.findAll({ 
            where: { role: 'admin' },
            attributes: ['id', 'name', 'email', 'role', 'isActive']
        });

        if (allAdmins.length === 0) {
            console.log('   ⚠️  Aucun utilisateur admin trouvé !');
        } else {
            allAdmins.forEach(user => {
                console.log(`   - ${user.email} (ID: ${user.id}, Actif: ${user.isActive})`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    checkAndFixAdmin();
}

module.exports = { checkAndFixAdmin };


