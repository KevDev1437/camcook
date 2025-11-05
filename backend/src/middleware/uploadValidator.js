/**
 * Middleware pour valider strictement les uploads d'images
 */

// Types MIME autorisés pour les images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Extension de fichiers autorisées
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Taille maximale en bytes (3MB)
const MAX_FILE_SIZE = 3 * 1024 * 1024;

/**
 * Valider une image base64
 */
const validateBase64Image = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return { valid: false, error: 'Image base64 invalide' };
  }

  // Vérifier le format base64
  const base64Regex = /^data:image\/([a-zA-Z]+);base64,/;
  const match = base64String.match(base64Regex);

  if (!match) {
    return { valid: false, error: 'Format base64 invalide. Format attendu: data:image/[type];base64,...' };
  }

  const mimeType = `image/${match[1].toLowerCase()}`;
  
  // Vérifier le type MIME
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { 
      valid: false, 
      error: `Type d'image non autorisé. Types autorisés: ${ALLOWED_MIME_TYPES.join(', ')}` 
    };
  }

  // Extraire les données base64
  const base64Data = base64String.split(',')[1];
  if (!base64Data) {
    return { valid: false, error: 'Données base64 manquantes' };
  }

  // Vérifier la taille (approximative)
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (sizeInBytes > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Image trop grande. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { valid: true, mimeType, size: sizeInBytes };
};

/**
 * Valider un fichier uploadé
 */
const validateUploadedFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  // Vérifier le type MIME
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Type de fichier non autorisé. Types autorisés: ${ALLOWED_MIME_TYPES.join(', ')}` 
    };
  }

  // Vérifier l'extension
  const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: `Extension non autorisée. Extensions autorisées: ${ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Fichier trop grand. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { valid: true, mimeType: file.mimetype, size: file.size };
};

/**
 * Middleware pour valider les uploads d'images dans le body (base64)
 */
const validateImageUpload = (req, res, next) => {
  const imageFields = ['image', 'images', 'photo', 'photos', 'avatar', 'logo'];
  
  for (const field of imageFields) {
    if (req.body[field]) {
      const validation = validateBase64Image(req.body[field]);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }
    }
    
    // Si c'est un tableau d'images
    if (Array.isArray(req.body[field])) {
      for (const image of req.body[field]) {
        const validation = validateBase64Image(image);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: validation.error
          });
        }
      }
    }
  }

  next();
};

/**
 * Middleware pour valider les fichiers uploadés via multer
 */
const validateUploadedImage = (req, res, next) => {
  if (!req.file && !req.files) {
    return next(); // Pas de fichier, passer au suivant
  }

  const files = req.files || [req.file];
  
  for (const file of files) {
    const validation = validateUploadedFile(file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
  }

  next();
};

// Exporter aussi uploadLimiter depuis rateLimiter pour faciliter l'utilisation
const { uploadLimiter } = require('./rateLimiter');

module.exports = {
  validateImageUpload,
  validateUploadedImage,
  validateBase64Image,
  validateUploadedFile,
  uploadLimiter, // Exporter pour faciliter l'utilisation dans les routes
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
};

