/**
 * Script pour réinitialiser le mot de passe admin
 * 
 * Ce script :
 * 1. Vérifie si l'utilisateur admin existe
 * 2. Réinitialise son mot de passe à "password123"
 * 3. Ou crée un nouvel utilisateur admin si il n'existe pas
 * 
 * Usage: node backend/scripts/reset-admin-password.js
 */

const { sequelize } = require('../src/config/database');
const { User } = require('../src/models/index');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion à la base de données réussie\n');

        const adminEmail = 'admin@camcook.fr';
        const adminPassword = 'password123';

        // Chercher l'utilisateur admin
        let admin = await User.findOne({ where: { email: adminEmail } });

        if (admin) {
            console.log(`📋 Utilisateur admin trouvé (ID: ${admin.id})`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Nom: ${admin.name}`);
            console.log(`   Rôle: ${admin.role}\n`);

            // Vérifier si le rôle est superadmin
            if (admin.role !== 'superadmin') {
                console.log('⚠️  L\'utilisateur n\'a pas le rôle superadmin. Mise à jour du rôle...');
                await admin.update({ role: 'superadmin' });
                console.log('✅ Rôle mis à jour à "superadmin"\n');
            }

            // Réinitialiser le mot de passe
            console.log('🔑 Réinitialisation du mot de passe...');
            
            // Mettre à jour le mot de passe (le hook beforeUpdate va hasher automatiquement)
            admin.password = adminPassword;
            await admin.save();

            console.log('✅ Mot de passe réinitialisé avec succès !\n');
        } else {
            console.log('📋 Aucun utilisateur admin trouvé. Création d\'un nouvel utilisateur admin...\n');

            // Créer un nouvel utilisateur admin
            admin = await User.create({
                name: 'Admin',
                email: adminEmail,
                phone: '+33612345678',
                password: adminPassword, // Le hook beforeCreate va hasher automatiquement
                role: 'superadmin'
            });

            console.log('✅ Utilisateur admin créé avec succès !\n');
        }

        // Vérifier que le mot de passe fonctionne
        console.log('🔍 Vérification du mot de passe...');
        const isValid = await bcrypt.compare(adminPassword, admin.password);
        
        if (isValid) {
            console.log('✅ Le mot de passe est correct !\n');
        } else {
            // Recharger l'utilisateur depuis la base de données
            await admin.reload();
            const isValidAfterReload = await bcrypt.compare(adminPassword, admin.password);
            
            if (isValidAfterReload) {
                console.log('✅ Le mot de passe est correct après rechargement !\n');
            } else {
                console.log('⚠️  Le mot de passe ne correspond pas. Réessayez...\n');
            }
        }

        // Afficher les identifiants
        console.log('='.repeat(60));
        console.log('📋 IDENTIFIANTS SUPER ADMIN');
        console.log('='.repeat(60));
        console.log(`Email    : ${adminEmail}`);
        console.log(`Password : ${adminPassword}`);
        console.log(`Rôle     : superadmin`);
        console.log('='.repeat(60));
        console.log('\n💡 Vous pouvez maintenant vous connecter au dashboard :');
        console.log('   http://localhost:5000/admin\n');

    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    resetAdminPassword();
}

module.exports = { resetAdminPassword };

