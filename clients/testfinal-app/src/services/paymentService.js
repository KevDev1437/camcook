import api from '../config/api';

/**
 * Créer un Payment Intent pour carte bancaire
 */
export const createPaymentIntent = async (amount, orderId = null, orderGroupId = null) => {
  try {
    const response = await api.post('/payments/create-intent', {
      amount,
      currency: 'eur',
      orderId,
      orderGroupId, // Utiliser orderGroupId pour grouper les paiements
      paymentMethodType: 'card',
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Erreur lors de la création du paiement');
  }
};

/**
 * Créer un Payment Intent pour Apple Pay
 */
export const createApplePayIntent = async (amount, orderId = null, orderGroupId = null) => {
  try {
    const response = await api.post('/payments/create-mobile-pay-intent', {
      amount,
      currency: 'eur',
      orderId,
      orderGroupId,
      paymentMethodType: 'apple_pay',
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Erreur lors de la création du paiement Apple Pay');
  }
};

/**
 * Créer un Payment Intent pour Google Pay
 */
export const createGooglePayIntent = async (amount, orderId = null, orderGroupId = null) => {
  try {
    const response = await api.post('/payments/create-mobile-pay-intent', {
      amount,
      currency: 'eur',
      orderId,
      orderGroupId,
      paymentMethodType: 'google_pay',
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Erreur lors de la création du paiement Google Pay');
  }
};

/**
 * Confirmer un paiement
 */
export const confirmPayment = async (paymentIntentId, orderId = null, orderGroupId = null) => {
  try {
    const response = await api.post('/payments/confirm', {
      paymentIntentId,
      orderId,
      orderGroupId, // Utiliser orderGroupId pour confirmer toutes les commandes du groupe
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Erreur lors de la confirmation du paiement');
  }
};

