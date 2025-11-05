/**
 * Middleware pour sanitizer les entrées utilisateur
 * Protection contre XSS et injection de code
 */

const validator = require('validator');
const sanitizeHtml = require('sanitize-html');

/**
 * Options de sanitization HTML
 */
const sanitizeOptions = {
  allowedTags: [], // Pas de tags HTML autorisés par défaut
  allowedAttributes: {},
  allowedIframeHostnames: [],
};

/**
 * Sanitizer un string (supprime les tags HTML et les caractères dangereux)
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  // Supprimer les tags HTML et les caractères dangereux
  return sanitizeHtml(input, sanitizeOptions);
};

/**
 * Sanitizer un email
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return null;
  }
  // Nettoyer et normaliser l'email
  const cleaned = email.trim().toLowerCase();
  // Vérifier que c'est un email valide
  if (validator.isEmail(cleaned)) {
    return cleaned;
  }
  return null;
};

/**
 * Sanitizer un nom (supprime les caractères spéciaux, garde seulement lettres, espaces, tirets)
 */
const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') {
    return null;
  }
  // Nettoyer et garder seulement lettres, espaces, tirets, apostrophes
  return name.trim().replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
};

/**
 * Sanitizer un téléphone
 */
const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  // Garder seulement les chiffres, espaces, tirets, plus, parenthèses
  return phone.trim().replace(/[^0-9+\-()\s]/g, '');
};

/**
 * Sanitizer un texte (supprime les tags HTML mais garde le texte)
 */
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }
  // Supprimer les tags HTML mais garder le texte
  return sanitizeHtml(text, sanitizeOptions);
};

/**
 * Sanitizer un entier
 */
const sanitizeInteger = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
};

/**
 * Sanitizer un nombre décimal
 */
const sanitizeFloat = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

/**
 * Middleware pour sanitizer le body de la requête
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Sanitizer les champs communs
    if (req.body.name) {
      req.body.name = sanitizeName(req.body.name);
    }
    if (req.body.email) {
      req.body.email = sanitizeEmail(req.body.email);
    }
    if (req.body.phone) {
      req.body.phone = sanitizePhone(req.body.phone);
    }
    if (req.body.message) {
      req.body.message = sanitizeText(req.body.message);
    }
    if (req.body.text) {
      req.body.text = sanitizeText(req.body.text);
    }
    if (req.body.subject) {
      req.body.subject = sanitizeText(req.body.subject);
    }
    if (req.body.notes) {
      req.body.notes = sanitizeText(req.body.notes);
    }
    if (req.body.description) {
      req.body.description = sanitizeText(req.body.description);
    }
  }
  
  next();
};

/**
 * Middleware pour sanitizer les paramètres de requête
 */
const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key)) {
        req.params[key] = sanitizeString(String(req.params[key]));
      }
    }
  }
  next();
};

/**
 * Middleware pour sanitizer les query strings
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        req.query[key] = sanitizeString(String(req.query[key]));
      }
    }
  }
  next();
};

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeBody,
  sanitizeParams,
  sanitizeQuery,
};

