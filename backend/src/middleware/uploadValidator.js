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
    return { 
      valid: false, 
      error: `Image base64 invalide: ${!base64String ? 'valeur manquante' : `type attendu: string, reçu: ${typeof base64String}`}` 
    };
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
 * Valider une URL d'image
 */
const validateImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL d\'image invalide' };
  }

  // Vérifier si c'est une URL valide (http, https, file, content)
  const urlRegex = /^(https?|file|content):\/\//i;
  if (!urlRegex.test(url)) {
    return { valid: false, error: 'Format d\'URL invalide. Format attendu: http://, https://, file://, ou content://' };
  }

  // Pour les URLs HTTP/HTTPS, vérifier l'extension
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const extension = url.toLowerCase().substring(url.lastIndexOf('.'));
    if (extension && !ALLOWED_EXTENSIONS.includes(extension)) {
      return { 
        valid: false, 
        error: `Extension non autorisée. Extensions autorisées: ${ALLOWED_EXTENSIONS.join(', ')}` 
      };
    }
  }

  return { valid: true, isUrl: true };
};

/**
 * Valider une image (base64 ou URL)
 */
const validateImage = (imageString) => {
  // Vérifier que c'est une string valide
  if (!imageString || typeof imageString !== 'string') {
    return { valid: false, error: 'Image invalide: doit être une string non vide' };
  }

  // Trim pour enlever les espaces
  const trimmed = imageString.trim();
  if (trimmed === '') {
    return { valid: false, error: 'Image invalide: chaîne vide' };
  }

  // Si c'est une base64 (commence par data:image/)
  if (trimmed.startsWith('data:image/')) {
    return validateBase64Image(trimmed);
  }

  // Sinon, c'est probablement une URL
  return validateImageUrl(trimmed);
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
 * Middleware pour valider les uploads d'images dans le body (base64 ou URL)
 */
const validateImageUpload = (req, res, next) => {
  const imageFields = ['image', 'images', 'photo', 'photos', 'avatar', 'logo'];
  
  for (const field of imageFields) {
    if (req.body[field]) {
      // Vérifier si c'est un tableau d'images EN PREMIER
      if (Array.isArray(req.body[field])) {
        // Si le tableau est vide, on passe (optionnel)
        if (req.body[field].length === 0) {
          continue;
        }
        
        for (let i = 0; i < req.body[field].length; i++) {
          const image = req.body[field][i];
          
          // Si l'image est null, undefined ou vide, on passe (optionnel)
          if (image === null || image === undefined || image === '') {
            continue;
          }
          
          // Vérifier que c'est bien une string
          if (typeof image !== 'string') {
            return res.status(400).json({
              success: false,
              error: `Image invalide dans le tableau ${field}[${i}]: doit être une string (base64 ou URL), reçu: ${typeof image}`
            });
          }
          
          // Valider soit base64 soit URL
          const validation = validateImage(image);
          if (!validation.valid) {
            return res.status(400).json({
              success: false,
              error: validation.error
            });
          }
        }
      } else {
        // Si c'est une string (image unique)
        // Vérifier que c'est bien une string
        if (typeof req.body[field] !== 'string') {
          return res.status(400).json({
            success: false,
            error: `Image invalide dans ${field}: doit être une string (base64 ou URL), reçu: ${typeof req.body[field]}`
          });
        }
        
        // Valider soit base64 soit URL
        const validation = validateImage(req.body[field]);
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
  validateImageUrl,
  validateImage, // Nouvelle fonction qui accepte base64 ou URL
  validateUploadedFile,
  uploadLimiter, // Exporter pour faciliter l'utilisation dans les routes
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
};

