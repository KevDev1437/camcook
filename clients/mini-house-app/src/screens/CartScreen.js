import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';
import { orderService } from '../services/orderService';
import api from '../config/api';

const CartScreen = ({navigation}) => {
  const { items, count, total, increment, decrement, remove, clear } = useCart();
  const { logout } = useAuth();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [creating, setCreating] = useState(false);
  const [pricesCache, setPricesCache] = useState({ accompaniments: {}, drinks: {} });

  // Récupérer les prix des accompagnements et boissons
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [accRes, drinksRes] = await Promise.all([
          api.get('/accompaniments'),
          api.get('/drinks'),
        ]);
        
        const accPrices = {};
        const accData = accRes?.data?.data || accRes?.data || [];
        if (Array.isArray(accData)) {
          accData.forEach(acc => {
            const name = acc.name || String(acc);
            const price = parseFloat(acc.price) || 0;
            accPrices[name] = price;
          });
        }
        
        const drinkPrices = {};
        const drinksData = drinksRes?.data?.data || drinksRes?.data || [];
        if (Array.isArray(drinksData)) {
          drinksData.forEach(drink => {
            const name = drink.name || String(drink);
            const price = parseFloat(drink.price) || 0;
            drinkPrices[name] = price;
          });
        }
        
        setPricesCache({ accompaniments: accPrices, drinks: drinkPrices });
      } catch (error) {
        console.error('Erreur récupération prix:', error);
      }
    };
    
    if (items.length > 0) {
      fetchPrices();
    } else {
      // Réinitialiser le cache si le panier est vide
      setPricesCache({ accompaniments: {}, drinks: {} });
    }
  }, [items.length]);

  const onCheckout = async () => {
    if (items.length === 0) {
      Alert.alert(
        'Panier vide',
        'Votre panier est vide. Veuillez d\'abord ajouter des articles au panier avant de commander.',
        [
          {
            text: 'Voir le menu',
            onPress: () => {
              // Naviguer vers HomeScreen (HomeMain dans HomeStack)
              // CartScreen est dans HomeStack, donc on peut naviguer directement vers HomeMain
              navigation.navigate('HomeMain');
            },
            style: 'default',
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      return;
    }
    // Validation rapide côté client
    const bad = items.find(it => !(Number.isFinite(Number(it.price)) && (it.quantity|0) > 0));
    if (bad) {
      Alert.alert('Panier invalide', 'Un article a un prix ou une quantité incorrecte.');
      return;
    }
    if (!Number.isFinite(Number(total)) || Number(total) < 0) {
      Alert.alert('Total invalide', 'Le total de la commande est incorrect.');
      return;
    }
    
    // Préparer les données de commande
    const orderData = {
      items: items.map(it => ({
        id: it.id,
        name: it.name,
        quantity: it.quantity,
        price: Number(it.price) || 0,
        options: it.options || {},
      })),
      subtotal: Number(total) || 0,
      deliveryFee: 0,
      tax: 0,
      total: Number(total) || 0,
      orderType: 'pickup',
      address: {},
      notes: null,
    };

    // Naviguer vers l'écran de paiement
    navigation.navigate('Payment', { orderData });
  };
  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background.light }]}>
      <Header
        onCart={() => navigation.navigate('Cart')}
        cartCount={count}
        notifications={notifications}
        notificationCount={notificationCount}
        onDeleteNotification={(notificationId) => {
          if (clearNotification) {
            clearNotification(notificationId);
          }
        }}
        onNotificationPress={(notif) => {
          // Marquer la notification comme lue
          if (notif.id && markAsRead) {
            markAsRead(notif.id);
          }
          if (notif.orderId) {
            // Naviguer vers la page de commandes avec l'orderId en paramètre
            navigation.navigate('Orders', { orderId: notif.orderId });
          } else {
            navigation.navigate('Orders');
          }
        }}
        onNotifications={() => {
          navigation.navigate('Orders');
        }}
        onProfile={() => navigation.navigate('Profile')}
        onLogout={logout}
        showCart={true}
      />

      <ScrollView style={[styles.scrollContainer, { backgroundColor: theme.background.light }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Hero 
          title="Votre panier" 
          subtitle="Vérifiez vos articles avant de commander"
          image={require('../assets/hero-cart.jpg')}
        />

        <View style={styles.content}>
          {/* Items du panier */}
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Votre panier est vide</Text>
              <Text style={[styles.emptySubtitle, { color: (theme.text.secondary || '#666') }]}>Découvrez nos plats et ajoutez vos envies.</Text>
              <TouchableOpacity 
                style={[styles.exploreBtn, { backgroundColor: theme.primary }]} 
                onPress={() => {
                  // Naviguer vers HomeScreen (HomeMain dans HomeStack)
                  // CartScreen est dans HomeStack, donc on peut naviguer directement vers HomeMain
                  navigation.navigate('HomeMain');
                }}
              >
                <Text style={[styles.exploreBtnText, { color: (theme.background.white || '#fff') }]}>Voir le menu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map((it) => {
              const accompagnements = Array.isArray(it.options?.accompagnements) ? it.options.accompagnements : [];
              // Priorité : utiliser boissons (pluriel) depuis options ou pricing.drinks
              const boissonsFromOptions = it.options?.boissons || it.options?.boisson || null;
              const boissonsFromPricing = it.pricing?.drinks || null;
              // Utiliser le tableau complet si disponible
              let boissonArray = [];
              if (boissonsFromPricing && Array.isArray(boissonsFromPricing)) {
                boissonArray = boissonsFromPricing;
              } else if (Array.isArray(boissonsFromOptions)) {
                boissonArray = boissonsFromOptions;
              } else if (boissonsFromOptions) {
                boissonArray = [boissonsFromOptions];
              }
              const unitPrice = Number(it.price) || 0;
              const totalPrice = unitPrice * (it.quantity || 1);
              
              // Calculer les prix des compléments
              let accompTotal = 0;
              let drinkPrice = 0;
              const accList = []; // [{name, price}]
              
              // Toujours utiliser le cache pour les prix individuels, même si pricing existe
              // car pricing contient seulement le total, pas les prix individuels
              if (Array.isArray(accompagnements) && accompagnements.length > 0) {
                accompagnements.forEach(acc => {
                  const accName = typeof acc === 'string' ? acc : (acc?.name || String(acc));
                  // Chercher dans le cache avec correspondance insensible à la casse
                  const cacheKey = Object.keys(pricesCache?.accompaniments || {}).find(
                    key => key.toLowerCase() === accName.toLowerCase()
                  ) || accName;
                  const price = pricesCache?.accompaniments?.[cacheKey] || pricesCache?.accompaniments?.[accName] || 0;
                  accompTotal += price;
                  accList.push({ name: accName, price });
                });
              }
              
              // Calculer le prix total de toutes les boissons
              if (boissonArray.length > 0) {
                let totalDrinkPrice = 0;
                boissonArray.forEach((drink, idx) => {
                  const drinkName = typeof drink === 'string' ? drink : (drink?.name || String(drink));
                  // Chercher dans le cache avec correspondance insensible à la casse
                  const cacheKey = Object.keys(pricesCache?.drinks || {}).find(
                    key => key.toLowerCase() === drinkName.toLowerCase()
                  ) || drinkName;
                  const individualPrice = pricesCache?.drinks?.[cacheKey] || pricesCache?.drinks?.[drinkName] || 0;
                  totalDrinkPrice += individualPrice;
                });
                drinkPrice = totalDrinkPrice;
              }
              
              // Priorité : utiliser pricing si disponible (plus précis et vient du backend)
              if (it.pricing) {
                const pricingAccompTotal = it.pricing.accompTotal || 0;
                const pricingDrinkPrice = it.pricing.drinkPrice || 0;
                const pricingBasePrice = it.pricing.basePrice || 0;
                
                // Utiliser les totaux depuis pricing (plus précis)
                accompTotal = pricingAccompTotal;
                drinkPrice = pricingDrinkPrice;
                
                // Mettre à jour les prix individuels dans accList en utilisant le cache si disponible
                // Sinon, répartir le total également
                if (accList.length > 0 && accompTotal > 0) {
                  // Si on a les prix individuels dans le cache, les utiliser
                  let cacheTotal = 0;
                  accList.forEach(acc => {
                    const cacheKey = Object.keys(pricesCache?.accompaniments || {}).find(
                      key => key.toLowerCase() === acc.name.toLowerCase()
                    ) || acc.name;
                    const cachePrice = pricesCache?.accompaniments?.[cacheKey] || pricesCache?.accompaniments?.[acc.name] || 0;
                    acc.price = cachePrice;
                    cacheTotal += cachePrice;
                  });
                  
                  // Si le total du cache ne correspond pas au total du pricing, répartir proportionnellement
                  if (cacheTotal > 0 && Math.abs(cacheTotal - accompTotal) > 0.01) {
                    const ratio = accompTotal / cacheTotal;
                    accList.forEach(acc => acc.price = acc.price * ratio);
                  } else if (cacheTotal === 0 && accompTotal > 0) {
                    // Si pas de prix dans le cache, répartir également
                    const pricePerAccomp = accompTotal / accList.length;
                    accList.forEach(acc => acc.price = pricePerAccomp);
                  }
                }
              }
              
              // Prix de base du menu = prix total - extras
              // Priorité : utiliser basePrice depuis pricing si disponible
              const basePrice = it.pricing?.basePrice || (unitPrice - accompTotal - drinkPrice);
              
              return (
                <View key={it.key} style={[styles.cartItemCard, { backgroundColor: (theme.background.white || '#fff') }]}>
                  {/* Image et infos principales */}
                  <View style={styles.itemHeader}>
                    {it.image ? (
                      <Image 
                        source={{ uri: it.image }} 
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.itemImage, styles.placeholderImage]}>
                        <MaterialIcons name="restaurant" size={32} color={theme.text.tertiary} />
                      </View>
                    )}
                    <View style={styles.itemMainInfo}>
                      <Text style={[styles.itemName, { color: theme.text.primary }]}>{it.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.itemUnitPrice, { color: (theme.text.secondary || '#666') }]}>{unitPrice.toFixed(2)} €</Text>
                        {it.quantity > 1 && (
                          <Text style={[styles.itemQuantityMultiplier, { color: theme.text.tertiary }]}>
                            × {it.quantity}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Détails des options et décomposition du prix */}
                  <View style={[styles.optionsSection, { borderTopColor: theme.background.border }]}>
                    <Text style={[styles.optionsSectionTitle, { color: theme.text.primary }]}>Détails de la commande</Text>
                    
                    {/* Décomposition du prix */}
                    <View style={[styles.priceBreakdown, { borderTopColor: theme.background.border }]}>
                      <View style={styles.priceBreakdownRow}>
                        <Text style={[styles.priceBreakdownLabel, { color: (theme.text.secondary || '#666') }]}>MENU :</Text>
                        <Text style={[styles.priceBreakdownValue, { color: theme.text.primary }]}>{basePrice.toFixed(2)} €</Text>
                      </View>
                      {accList.length > 0 && (
                        <View style={styles.priceBreakdownSection}>
                          <Text style={[styles.priceBreakdownSectionTitle, { color: (theme.text.secondary || '#666') }]}>ACCOMPAGNEMENT</Text>
                          {accList.map((acc, accIdx) => (
                            <View key={`acc-${accIdx}`} style={styles.priceBreakdownSubItem}>
                              <Text style={[styles.priceBreakdownSubItemText, { color: theme.text.primary }]}>
                                - {acc.name}
                              </Text>
                              <Text style={[styles.priceBreakdownSubItemPrice, { color: (theme.text.secondary || '#666') }]}>
                                {acc.price > 0 ? `${acc.price.toFixed(2)} €` : 'Gratuit'}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {boissonArray.length > 0 && (
                        <View style={styles.priceBreakdownSection}>
                          <Text style={[styles.priceBreakdownSectionTitle, { color: (theme.text.secondary || '#666') }]}>
                            {boissonArray.length > 1 ? 'Boissons' : 'Boisson'}
                          </Text>
                          {boissonArray.map((drink, idx) => {
                            const drinkName = typeof drink === 'string' ? drink : (drink?.name || String(drink));
                            // Utiliser le prix calculé depuis le cache pour cette boisson spécifique
                            const drinkNameForPrice = typeof drink === 'string' ? drink : (drink?.name || String(drink));
                            const cacheKeyDrink = Object.keys(pricesCache?.drinks || {}).find(
                              key => key.toLowerCase() === drinkNameForPrice.toLowerCase()
                            ) || drinkNameForPrice;
                            const drinkPriceDisplay = pricesCache?.drinks?.[cacheKeyDrink] || pricesCache?.drinks?.[drinkNameForPrice] || 0;
                            // Si le pricing contient le total et qu'on a plusieurs boissons, répartir proportionnellement
                            // Sinon utiliser le prix individuel du cache
                            const individualPrice = drinkPriceDisplay || (it.pricing?.drinkPrice && boissonArray.length === 1 ? it.pricing.drinkPrice : 0);
                            return (
                              <View key={`drink-${idx}`} style={styles.priceBreakdownSubItem}>
                                <Text style={[styles.priceBreakdownSubItemText, { color: theme.text.primary }]}>
                                  - {drinkName}
                                </Text>
                                <Text style={[styles.priceBreakdownSubItemPrice, { color: (theme.text.secondary || '#666') }]}>
                                  {individualPrice > 0 ? `${individualPrice.toFixed(2)} €` : 'Gratuit'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* Contrôles de quantité et suppression */}
                  <View style={[styles.itemActions, { borderTopColor: theme.background.border }]}>
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity 
                        style={[styles.quantityButton, { backgroundColor: theme.primary }]} 
                        onPress={() => decrement(it.key)}
                      >
                        <Text style={[styles.quantityButtonText, { color: (theme.background.white || '#fff') }]}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{it.quantity}</Text>
                      <TouchableOpacity 
                        style={[styles.quantityButton, { backgroundColor: theme.primary }]} 
                        onPress={() => increment(it.key)}
                      >
                        <Text style={[styles.quantityButtonText, { color: (theme.background.white || '#fff') }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => {
                        Alert.alert(
                          'Supprimer',
                          `Voulez-vous supprimer "${it.name}" du panier ?`,
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Supprimer', style: 'destructive', onPress: () => remove(it.key) },
                          ]
                        );
                      }}
                    >
                      <MaterialIcons name="delete-outline" size={20} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Barre récapitulatif */}
          <View style={[styles.summaryBar, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={[styles.totalAmount, { color: theme.primary }]}>{Number(total).toFixed(2)} €</Text>
            </View>
            {/* Debug: Afficher le détail des prix */}
            {items.length > 0 && (
              <View style={{ marginBottom: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.background.border }}>
                <Text style={{ fontSize: 11, color: theme.text.tertiary, marginBottom: 4 }}>Détail:</Text>
                {items.map((it, idx) => (
                  <Text key={idx} style={{ fontSize: 10, color: theme.text.tertiary }}>
                    • {it.name}: {Number(it.price).toFixed(2)}€ × {it.quantity} = {(Number(it.price) * (it.quantity || 1)).toFixed(2)}€
                  </Text>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.checkoutButton, { backgroundColor: theme.primary }, creating && { opacity: 0.7 }]} onPress={onCheckout} disabled={creating}>
              <Text style={[styles.checkoutButtonText, { color: (theme.background.white || '#fff') }]}>{creating ? 'Création…' : 'Commander'}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />
        </View>

        <Footer onContact={() => navigation.navigate('Contact')} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'column' },
  scrollContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { padding: 15 },
  cartItemCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemMainInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  itemUnitPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemQuantityMultiplier: {
    fontSize: 13,
    marginLeft: 6,
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  optionsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionGroup: {
    marginBottom: 12,
  },
  optionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  optionItems: {
    marginLeft: 22,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionItemText: {
    fontSize: 13,
    marginLeft: 6,
  },
  priceBreakdown: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceBreakdownLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceBreakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceBreakdownSection: {
    marginTop: 10,
    marginLeft: 8,
  },
  priceBreakdownSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  priceBreakdownSubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 8,
  },
  priceBreakdownSubItemText: {
    fontSize: 12,
    flex: 1,
  },
  priceBreakdownSubItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptySubtitle: { fontSize: 13, marginTop: 6, marginBottom: 14 },
  exploreBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  exploreBtnText: { fontWeight: '600' },
  summaryBar: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen;
