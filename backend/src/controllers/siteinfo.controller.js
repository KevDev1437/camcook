const { SiteInfo, ContactMessage } = require('../models');

// GET /api/site-info
exports.getSiteInfo = async (req, res) => {
  try {
    const info = await SiteInfo.findOne({ order: [['id', 'ASC']] });
    res.status(200).json({ success: true, data: info || {} });
  } catch (error) {
    console.error('Error fetching site info:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des infos' });
  }
};

// PUT /api/site-info
exports.upsertSiteInfo = async (req, res) => {
  try {
    const { phone, email, address } = req.body;
    let info = await SiteInfo.findOne({ order: [['id', 'ASC']] });
    if (!info) {
      info = await SiteInfo.create({ phone, email, address });
    } else {
      await info.update({ phone, email, address });
    }
    res.status(200).json({ success: true, data: info });
  } catch (error) {
    console.error('Error updating site info:', error);
    res.status(400).json({ success: false, error: error.message || 'Erreur lors de la mise à jour' });
  }
};

// POST /api/site-info/contact
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, type = 'restaurant', message } = req.body || {};
    const errors = [];
    if (!name || String(name).trim().length === 0) errors.push('Nom requis');
    if (!email || String(email).trim().length === 0) errors.push('Email requis');
    const emailTrimmed = (email || '').trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (email && !emailOk) errors.push('Email invalide');
    if (!message || String(message).trim().length === 0) errors.push('Message requis');
    const allowedTypes = ['restaurant', 'problem'];
    if (type && !allowedTypes.includes(type)) errors.push('Type invalide');
    if (errors.length) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    const created = await ContactMessage.create({
      name: String(name).trim(),
      email: emailTrimmed,
      type: allowedTypes.includes(type) ? type : 'restaurant',
      message: String(message).trim(),
    });

    return res.status(201).json({ success: true, data: { id: created.id } });
  } catch (error) {
    console.error('Error handling contact message:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi' });
  }
};
