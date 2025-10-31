const dotenv = require('dotenv');
const { sequelize } = require('../src/config/database');
const { SiteInfo } = require('../src/models');

dotenv.config();

const seedSiteInfo = async () => {
  try {
    console.log('🌱 Seeding SiteInfo...');
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // Ensure table exists
    await sequelize.sync({ alter: true });

    // Upsert values provided by the user
    const payload = {
      phone: '+33 619 35 65 51',
      email: 'camcook@camcook.fr',
      address: 'Lyon 8 ieme arrondissement',
    };

    let info = await SiteInfo.findOne({ order: [['id', 'ASC']] });
    if (!info) {
      info = await SiteInfo.create(payload);
      console.log('✅ Created SiteInfo');
    } else {
      await info.update(payload);
      console.log('✅ Updated SiteInfo');
    }

    console.log('✅ SiteInfo seed completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding SiteInfo:', error);
    process.exit(1);
  }
};

seedSiteInfo();
