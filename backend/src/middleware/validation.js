/**
 * Middleware de validation avec Joi
 * 
 * Fournit des schémas de validation réutilisables pour standardiser
 * la validation des entrées utilisateur dans toute l'application.
 * 
 * @module middleware/validation
 */

const Joi = require('joi');

/**
 * Middleware de validation avec Joi
 * 
 * @param {Joi.ObjectSchema} schema - Schéma Joi à valider
 * @returns {Function} Middleware Express
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retourner toutes les erreurs, pas seulement la première
      stripUnknown: true, // Supprimer les champs non définis dans le schéma
      allowUnknown: false // Rejeter les champs inconnus
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '') // Retirer les guillemets
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors
      });
    }

    // Remplacer req.body par la version validée et nettoyée
    req.body = value;
    next();
  };
};

/**
 * Schémas de validation réutilisables
 */
const schemas = {
  /**
   * Schéma pour créer un restaurant
   */
  createRestaurant: Joi.object({
    name: Joi.string().min(2).max(150).trim().required()
      .messages({
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 150 caractères',
        'any.required': 'Le nom est requis'
      }),
    
    email: Joi.string().email().trim().required()
      .messages({
        'string.email': 'L\'email doit être valide',
        'any.required': 'L\'email est requis'
      }),
    
    phone: Joi.string().pattern(/^[+]?[\d\s\-()]+$/).min(8).max(20).trim().required()
      .messages({
        'string.pattern.base': 'Le numéro de téléphone doit être valide',
        'string.min': 'Le numéro de téléphone doit contenir au moins 8 caractères',
        'string.max': 'Le numéro de téléphone ne peut pas dépasser 20 caractères',
        'any.required': 'Le numéro de téléphone est requis'
      }),
    
    street: Joi.string().min(5).max(200).trim().required()
      .messages({
        'string.min': 'L\'adresse doit contenir au moins 5 caractères',
        'string.max': 'L\'adresse ne peut pas dépasser 200 caractères',
        'any.required': 'L\'adresse est requise'
      }),
    
    city: Joi.string().min(2).max(100).trim().required()
      .messages({
        'string.min': 'La ville doit contenir au moins 2 caractères',
        'string.max': 'La ville ne peut pas dépasser 100 caractères',
        'any.required': 'La ville est requise'
      }),
    
    postalCode: Joi.string().pattern(/^[\d\s\-]+$/).max(20).trim().optional()
      .allow(null)
      .allow('')
      .messages({
        'string.pattern.base': 'Le code postal doit être valide'
      }),
    
    description: Joi.string().max(500).trim().optional()
      .allow(null)
      .allow('')
      .messages({
        'string.max': 'La description ne peut pas dépasser 500 caractères'
      }),
    
    logo: Joi.string().uri().trim().optional()
      .allow(null)
      .allow('')
      .messages({
        'string.uri': 'Le logo doit être une URL valide'
      }),
    
    subscriptionPlan: Joi.string().valid('free', 'starter', 'pro', 'enterprise').optional()
      .default('free')
      .messages({
        'any.only': 'Le plan d\'abonnement doit être: free, starter, pro ou enterprise'
      }),
    
    ownerId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'L\'ID du propriétaire doit être un nombre',
        'number.integer': 'L\'ID du propriétaire doit être un entier',
        'number.positive': 'L\'ID du propriétaire doit être positif',
        'any.required': 'L\'ID du propriétaire est requis'
      })
  }),

  /**
   * Schéma pour créer une commande
   */
  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().positive().optional()
          .allow(null),
        menuItemId: Joi.number().integer().positive().optional()
          .allow(null),
        name: Joi.string().min(1).max(200).trim().required(),
        quantity: Joi.number().integer().positive().min(1).max(100).required(),
        price: Joi.number().positive().precision(2).required(),
        unitPrice: Joi.number().positive().precision(2).optional(),
        options: Joi.object({
          accompagnements: Joi.array().items(Joi.string()).optional(),
          boisson: Joi.string().optional().allow(null)
        }).optional()
      })
    ).min(1).max(50).required()
      .messages({
        'array.min': 'Au moins un article est requis',
        'array.max': 'Maximum 50 articles par commande',
        'any.required': 'Les articles sont requis'
      }),
    
    subtotal: Joi.number().positive().precision(2).required(),
    deliveryFee: Joi.number().min(0).precision(2).optional().default(0),
    tax: Joi.number().min(0).precision(2).optional().default(0),
    total: Joi.number().positive().precision(2).required(),
    
    orderType: Joi.string().valid('pickup', 'delivery').optional().default('pickup'),
    
    address: Joi.object({
      street: Joi.string().min(5).max(200).trim().optional().allow(null).allow(''),
      city: Joi.string().min(2).max(100).trim().optional().allow(null).allow(''),
      postalCode: Joi.string().pattern(/^[\d\s\-]+$/).max(20).trim().optional().allow(null).allow(''),
      latitude: Joi.number().min(-90).max(90).optional().allow(null),
      longitude: Joi.number().min(-180).max(180).optional().allow(null),
      instructions: Joi.string().max(500).trim().optional().allow(null).allow('')
    }).optional().default({}),
    
    notes: Joi.string().max(500).trim().optional().allow(null).allow('').default('')
  }),

  /**
   * Schéma pour créer un menu item
   */
  createMenuItem: Joi.object({
    name: Joi.string().min(2).max(200).trim().required()
      .messages({
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 200 caractères',
        'any.required': 'Le nom est requis'
      }),
    
    description: Joi.string().max(1000).trim().optional()
      .allow(null)
      .allow('')
      .messages({
        'string.max': 'La description ne peut pas dépasser 1000 caractères'
      }),
    
    category: Joi.string().min(2).max(100).trim().required()
      .messages({
        'string.min': 'La catégorie doit contenir au moins 2 caractères',
        'string.max': 'La catégorie ne peut pas dépasser 100 caractères',
        'any.required': 'La catégorie est requise'
      }),
    
    price: Joi.number().positive().precision(2).required()
      .messages({
        'number.base': 'Le prix doit être un nombre',
        'number.positive': 'Le prix doit être positif',
        'any.required': 'Le prix est requis'
      }),
    
    images: Joi.array().items(Joi.string().uri()).optional()
      .allow(null)
      .messages({
        'array.includes': 'Les images doivent être des URLs valides'
      }),
    
    options: Joi.alternatives().try(
      Joi.array(),
      Joi.string(), // JSON string
      Joi.object()
    ).optional().allow(null),
    
    preparationTime: Joi.number().integer().min(0).max(300).optional()
      .allow(null)
      .messages({
        'number.min': 'Le temps de préparation doit être positif',
        'number.max': 'Le temps de préparation ne peut pas dépasser 300 minutes'
      }),
    
    isAvailable: Joi.boolean().optional().default(true),
    isPopular: Joi.boolean().optional().default(false),
    
    allergens: Joi.array().items(Joi.string()).optional().allow(null),
    calories: Joi.number().integer().min(0).optional().allow(null),
    protein: Joi.number().min(0).precision(2).optional().allow(null),
    carbs: Joi.number().min(0).precision(2).optional().allow(null),
    fat: Joi.number().min(0).precision(2).optional().allow(null),
    
    restaurantId: Joi.number().integer().positive().optional()
      // restaurantId sera ajouté automatiquement par restaurantContext
  }),

  /**
   * Schéma pour mettre à jour l'abonnement d'un restaurant
   */
  updateRestaurantSubscription: Joi.object({
    subscriptionPlan: Joi.string().valid('free', 'starter', 'pro', 'enterprise').optional()
      .messages({
        'any.only': 'Le plan d\'abonnement doit être: free, starter, pro ou enterprise'
      }),
    
    subscriptionStatus: Joi.string().valid('active', 'inactive', 'trial', 'cancelled').optional()
      .messages({
        'any.only': 'Le statut d\'abonnement doit être: active, inactive, trial ou cancelled'
      }),
    
    subscriptionStartDate: Joi.date().iso().optional()
      .allow(null)
      .messages({
        'date.format': 'La date de début doit être au format ISO (YYYY-MM-DD)'
      }),
    
    subscriptionEndDate: Joi.date().iso().min('now').optional()
      .allow(null)
      .messages({
        'date.format': 'La date de fin doit être au format ISO (YYYY-MM-DD)',
        'date.min': 'La date de fin doit être dans le futur'
      })
  })
};

module.exports = { validate, schemas };

