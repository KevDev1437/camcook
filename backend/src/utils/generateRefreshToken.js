/**
 * Génère un refresh token pour l'authentification
 * Les refresh tokens sont plus longs et ont une durée de vie plus longue que les access tokens
 */

const jwt = require('jsonwebtoken');

/**
 * Génère un refresh token
 * @param {number} userId - ID de l'utilisateur
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: '7d', // 7 jours
    }
  );
};

/**
 * Vérifie un refresh token
 * @param {string} token - Refresh token
 * @returns {object} Données décodées du token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );
};

module.exports = {
  generateRefreshToken,
  verifyRefreshToken,
};





