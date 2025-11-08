import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StatusBadge from '../components/admin/StatusBadge';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Hero from '../components/Hero';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { orderService } from '../services/orderService';

const OrdersScreen = ({ navigation, route }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();
  const { restaurantId } = useRestaurant(); // MULTI-TENANT: Récupérer restaurantId pour filtrer les commandes

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | confirmed | preparing | ready | on_delivery | completed | cancelled | rejected
  const [banner, setBanner] = useState(null); // { orderNumber, status }
  const lastStatusRef = useRef({}); // id -> status
  const [expandedOrderId, setExpandedOrderId] = useState(null); // ID de la commande ouverte
  const [orderDetails, setOrderDetails] = useState({}); // id -> orderDetails avec items
  const [loadingDetails, setLoadingDetails] = useState({}); // id -> boolean
  const [pricesCache, setPricesCache] = useState({ accompaniments: {}, drinks: {} }); // Cache des prix
  const [currentTime, setCurrentTime] = useState(new Date()); // Pour le décompte en temps réel

  const fetchMine = async () => {
    setRefreshing(true);
    try {
      // Le backend filtre déjà par restaurantId via le header X-Restaurant-Id
      // Mais on ajoute un filtre côté client pour sécurité supplémentaire
      const data = await orderService.getMyOrders();
      
      // MULTI-TENANT: Filtrer les commandes par restaurantId (sécurité supplémentaire)
      const filteredOrders = restaurantId 
        ? data.filter(order => order.restaurantId === restaurantId)
        : data;
      
      setOrders(filteredOrders);
      
      // Detecter les changements de statut pour afficher une bannière
      // Les notifications sont maintenant gérées par NotificationContext
      for (const o of filteredOrders) {
        const prev = lastStatusRef.current[o.id];
        if (prev && prev !== o.status) {
          // Changement de statut détecté
          setBanner({ orderNumber: o.orderNumber, status: o.status });
        }
        lastStatusRef.current[o.id] = o.status;
      }
    } catch (e) {
      console.error('OrdersScreen - Erreur fetchMine:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMine(); }, []);
  useEffect(() => {
    const id = setInterval(fetchMine, 12000);
    return () => clearInterval(id);
  }, []);

  // Mettre à jour le temps actuel toutes les secondes pour le décompte en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Mise à jour toutes les secondes pour un décompte fluide (comme une montre)
    
    return () => clearInterval(timer);
  }, []);

  // Fonction pour obtenir le label d'un statut
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'en attente',
      confirmed: 'confirmée',
      preparing: 'en préparation',
      ready: 'prête',
      on_delivery: 'en livraison',
      completed: 'terminée',
      cancelled: 'annulée',
      rejected: 'refusée',
    };
    return labels[status] || status;
  };

  // Composant FilterButton
  const FilterButton = ({ value, label }) => (
    <TouchableOpacity 
      onPress={() => setStatusFilter(value)} 
      style={[styles.filterBtn, statusFilter === value && styles.filterBtnActive]}
    >
      <Text style={[styles.filterText, statusFilter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Charger les prix des accompagnements et boissons au montage
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const [accRes, drinkRes] = await Promise.all([
          api.get('/accompaniments'),
          api.get('/drinks')
        ]);
        const accompaniments = {};
        const drinks = {};
        (accRes.data?.data || []).forEach(acc => {
          accompaniments[acc.name] = parseFloat(acc.price) || 0;
        });
        (drinkRes.data?.data || []).forEach(drink => {
          drinks[drink.name] = parseFloat(drink.price) || 0;
        });
        setPricesCache({ accompaniments, drinks });
      } catch (e) {
        console.error('Erreur chargement prix:', e);
      }
    };
    loadPrices();
  }, []);

  const handleToggleDetails = useCallback(async (orderId) => {
    console.log('🔔 OrdersScreen - handleToggleDetails appelé pour orderId:', orderId);
    // Si la commande est déjà ouverte, la fermer
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    // Ouvrir la nouvelle commande
    setExpandedOrderId(orderId);

    // Si on a déjà les détails en cache, ne pas recharger
    if (orderDetails[orderId]) {
      console.log('  - Détails déjà en cache pour orderId:', orderId);
      return;
    }

    // Charger les détails
    try {
      console.log('  - Chargement des détails pour orderId:', orderId);
      setLoadingDetails(prev => ({ ...prev, [orderId]: true }));
      const orderData = await orderService.getOrderById(orderId);
      
      // S'assurer que items est un tableau
      if (orderData && !Array.isArray(orderData.items)) {
        if (typeof orderData.items === 'string') {
          try {
            orderData.items = JSON.parse(orderData.items);
          } catch (e) {
            console.error('Error parsing items JSON:', e);
            orderData.items = [];
          }
        } else {
          orderData.items = [];
        }
      }
      
      console.log('  - Détails chargés avec succès pour orderId:', orderId);
      setOrderDetails(prev => ({ ...prev, [orderId]: orderData }));
    } catch (e) {
      console.error('Error loading order details:', e);
      Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
      setExpandedOrderId(null); // Fermer si erreur
    } finally {
      setLoadingDetails(prev => ({ ...prev, [orderId]: false }));
    }
  }, [expandedOrderId, orderDetails]);

  // Vérifier si un orderId est passé en paramètre (depuis une notification)
  useEffect(() => {
    if (route?.params?.orderId && orders.length > 0) {
      const orderIdToOpen = route.params.orderId;
      console.log('🔔 OrdersScreen - orderId reçu en paramètre:', orderIdToOpen);
      console.log('  - Nombre de commandes chargées:', orders.length);
      // Attendre que les commandes soient chargées avant d'ouvrir les détails
      const timeoutId = setTimeout(() => {
        console.log('  - Ouverture automatique des détails pour orderId:', orderIdToOpen);
        handleToggleDetails(orderIdToOpen);
        // Nettoyer les paramètres pour éviter de rouvrir à chaque rendu
        navigation.setParams({ orderId: undefined });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [route?.params?.orderId, orders.length, handleToggleDetails, navigation]);

  const Row = ({ label, value, strong }) => (
    <View style={styles.modalRow}> 
      <Text style={[styles.modalRowLabel, strong && { fontWeight: '800' }]}>{label}</Text>
      <Text style={[styles.modalRowValue, strong && { color: '#22c55e' }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <Header
        onCart={() => {
          // D'après les logs : Cart est dans HomeStack, pas dans RootStack
          // Structure: TabNavigator > OrdersStack > OrdersScreen
          // Cart est dans: TabNavigator > HomeStack > Cart
          // Il faut naviguer vers Home (TabNavigator) puis Cart (HomeStack)
          const tabNavigator = navigation.getParent();
          if (tabNavigator) {
            tabNavigator.navigate('Home', { screen: 'Cart' });
          }
        }}
        cartCount={count}
        notifications={notifications}
        notificationCount={notificationCount}
        onDeleteNotification={(notificationId) => {
          console.log('🗑️ OrdersScreen - Suppression de notification:', notificationId);
          if (clearNotification) {
            clearNotification(notificationId);
          }
        }}
        onNotificationPress={(notif) => {
          console.log('🔔 OrdersScreen - onNotificationPress appelé');
          console.log('  - Notification:', JSON.stringify(notif, null, 2));
          // Marquer la notification comme lue
          if (notif.id && markAsRead) {
            console.log('  - Marquage de la notification comme lue:', notif.id);
            markAsRead(notif.id);
          }
          if (notif.orderId) {
            console.log('  - orderId trouvé:', notif.orderId);
            // Si on est déjà sur la page Orders, ouvrir directement les détails
            if (orders.length > 0) {
              console.log('  - Déjà sur Orders, ouverture des détails');
              setTimeout(() => {
                handleToggleDetails(notif.orderId);
              }, 300);
            } else {
              // Sinon, attendre que les commandes soient chargées
              console.log('  - Attente du chargement des commandes');
              setTimeout(() => {
                handleToggleDetails(notif.orderId);
              }, 800);
            }
          } else {
            console.log('  - ❌ orderId non trouvé dans la notification');
          }
        }}
        onNotifications={() => {
          console.log('🔔 OrdersScreen - onNotifications appelé (fallback)');
          const tabNavigator = navigation.getParent();
          if (tabNavigator) {
            tabNavigator.navigate('Orders');
          }
        }}
        onProfile={() => {
          // D'après les logs : Profile est dans HomeStack, pas dans TabNavigator
          // Le TabNavigator a seulement : "Home", "Orders", "Contact"
          // Profile est dans : TabNavigator > HomeStack > Profile
          // Il faut naviguer vers Home (TabNavigator) puis Profile (HomeStack)
          const tabNavigator = navigation.getParent();
          if (tabNavigator) {
            tabNavigator.navigate('Home', { screen: 'Profile' });
          }
        }}
        onLogout={logout}
        showCart={true}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMine} />}
      >
        <Hero 
          title="Vos commandes" 
          subtitle="Historique et suivi en temps réel"
          image={require('../assets/hero-orders.jpg')}
        />
        <View style={styles.content}>
          {banner && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Mise à jour: #{banner.orderNumber} → {banner.status}</Text>
              <TouchableOpacity onPress={() => setBanner(null)}>
                <Text style={styles.bannerClose}>OK</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Filtres par statut */}
          <View style={styles.filtersRow}>
            <FilterButton value="all" label="Toutes" />
            <FilterButton value="pending" label="En attente" />
            <FilterButton value="confirmed" label="Confirmées" />
            <FilterButton value="preparing" label="En préparation" />
            <FilterButton value="ready" label="Prêtes" />
            <FilterButton value="on_delivery" label="En livraison" />
            <FilterButton value="completed" label="Terminées" />
            <FilterButton value="cancelled" label="Annulées" />
            <FilterButton value="rejected" label="Refusées" />
          </View>

          {/* Liste des commandes filtrées */}
          {(() => {
            const filteredOrders = statusFilter === 'all' 
              ? orders 
              : orders.filter(o => o.status === statusFilter);
            
            if (filteredOrders.length === 0) {
              return (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {statusFilter === 'all' 
                      ? 'Aucune commande' 
                      : `Aucune commande ${getStatusLabel(statusFilter)}`}
                  </Text>
                </View>
              );
            }

            return filteredOrders.map((o) => {
              const isExpanded = expandedOrderId === o.id;
              const details = orderDetails[o.id];
              const isLoadingDetail = loadingDetails[o.id];
              
              return (
                <View key={o.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>Commande #{o.orderNumber}</Text>
                  <StatusBadge status={o.status} type="order" />
                </View>
                <Text style={styles.restaurantName}>{o.restaurant?.name || 'Restaurant'}</Text>
                <Text style={styles.orderDate}>{new Date(o.createdAt).toLocaleString()}</Text>
                {o.status === 'preparing' && o.estimatedReadyTime && (
                  <View style={styles.estimatedTimeContainer}>
                    <Text style={styles.estimatedTimeLabel}>⏱️ Prêt dans environ :</Text>
                    <Text style={styles.estimatedTimeValue}>
                      {(() => {
                        const estimated = new Date(o.estimatedReadyTime);
                        const diffMs = estimated - currentTime;
                        if (diffMs <= 0) {
                          return 'Bientôt prêt';
                        }
                        const diffSecs = Math.floor(diffMs / 1000);
                        const diffMins = Math.floor(diffSecs / 60);
                        const remainingSecs = diffSecs % 60;
                        
                        // Si moins d'une minute, afficher en secondes
                        if (diffMins < 1) {
                          return `${diffSecs} sec`;
                        }
                        
                        // Si moins d'une heure, afficher minutes et secondes
                        if (diffMins < 60) {
                          return `${diffMins} min ${remainingSecs} sec`;
                        }
                        
                        // Si plus d'une heure, afficher heures et minutes
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
                      })()}
                    </Text>
                  </View>
                )}
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>{Number(o.total || 0).toFixed(2)} €</Text>
                  <TouchableOpacity 
                    style={styles.detailsButton} 
                    onPress={() => handleToggleDetails(o.id)}
                    disabled={isLoadingDetail}
                  >
                    <Text style={styles.detailsButtonText}>
                      {isExpanded ? 'Masquer' : 'Détails'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Dropdown avec les détails */}
                {isExpanded && (
                  <View style={styles.orderDetailsDropdown}>
                    {isLoadingDetail ? (
                      <View style={styles.detailsLoader}>
                        <ActivityIndicator size="small" color="#22c55e" />
                        <Text style={styles.detailsLoaderText}>Chargement...</Text>
                      </View>
                    ) : details ? (
                      <View style={styles.detailsContent}>
                        {/* Informations commande */}
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsSectionTitle}>Informations</Text>
                          <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Date de commande</Text>
                            <Text style={styles.detailsValue}>
                              {details.createdAt ? new Date(details.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </Text>
                          </View>
                          <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Type de livraison</Text>
                            <Text style={styles.detailsValue}>
                              {details.orderType === 'delivery' ? 'Livraison' : 'À emporter'}
                            </Text>
                          </View>
                        </View>

                        {/* Articles commandés */}
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsSectionTitle}>Articles commandés</Text>
                          {(() => {
                            const items = details.items;
                            let itemsArray = [];
                            
                            if (Array.isArray(items)) {
                              itemsArray = items;
                            } else if (typeof items === 'string') {
                              try {
                                itemsArray = JSON.parse(items);
                                if (!Array.isArray(itemsArray)) itemsArray = [];
                              } catch { itemsArray = []; }
                            } else if (items) {
                              itemsArray = [items];
                            }

                            if (itemsArray.length > 0) {
                              return itemsArray.map((it, idx) => {
                                const quantity = it.quantity || 1;
                                const unitPrice = Number(it.price || it.unitPrice || 0);
                                const lineTotal = unitPrice * quantity;
                                
                                // Calculer les prix des compléments
                                let accompTotal = 0;
                                let drinkPrice = 0;
                                const accList = []; // [{name, price}]
                                const drinkName = it.options?.boisson ? (Array.isArray(it.options.boisson) ? it.options.boisson[0] : it.options.boisson) : null;
                                
                                if (it.options?.accompagnements && Array.isArray(it.options.accompagnements)) {
                                  it.options.accompagnements.forEach(acc => {
                                    const accName = typeof acc === 'string' ? acc : (acc?.name || String(acc));
                                    const price = pricesCache?.accompaniments?.[accName] || 0;
                                    accompTotal += price;
                                    accList.push({ name: accName, price });
                                  });
                                }
                                
                                if (drinkName) {
                                  drinkPrice = pricesCache?.drinks?.[drinkName] || 0;
                                }
                                
                                // Prix de base du menu = prix total - extras
                                const basePrice = unitPrice - accompTotal - drinkPrice;
                                
                                return (
                                  <View key={`item-${idx}-${it.id || idx}`} style={styles.orderItemRow}>
                                    <Text style={styles.orderItemQty}>x{quantity}</Text>
                                    <View style={styles.orderItemInfo}>
                                      <Text style={styles.orderItemName}>{it.name || 'Article'}</Text>
                                      
                                      {/* Structure hiérarchique des prix */}
                                      <View style={styles.priceBreakdown}>
                                        {/* MENU : montant */}
                                        <View style={styles.priceBreakdownRow}>
                                          <Text style={styles.priceBreakdownLabel}>MENU :</Text>
                                          <Text style={styles.priceBreakdownValue}>{basePrice.toFixed(2)} €</Text>
                                        </View>
                                        
                                        {/* ACCOMPAGNEMENT */}
                                        {accList.length > 0 && (
                                          <View style={styles.priceBreakdownSection}>
                                            <Text style={styles.priceBreakdownSectionTitle}>ACCOMPAGNEMENT</Text>
                                            {accList.map((acc, accIdx) => (
                                              <View key={`acc-${accIdx}`} style={styles.priceBreakdownSubItem}>
                                                <Text style={styles.priceBreakdownSubItemText}>
                                                  - {acc.name}
                                                </Text>
                                                <Text style={styles.priceBreakdownSubItemPrice}>
                                                  {acc.price > 0 ? `${acc.price.toFixed(2)} €` : 'Gratuit'}
                                                </Text>
                                              </View>
                                            ))}
                                          </View>
                                        )}
                                        
                                        {/* Boisson */}
                                        {drinkName && (
                                          <View style={styles.priceBreakdownSection}>
                                            <Text style={styles.priceBreakdownSectionTitle}>Boisson</Text>
                                            <View style={styles.priceBreakdownSubItem}>
                                              <Text style={styles.priceBreakdownSubItemText}>
                                                - {drinkName}
                                              </Text>
                                              <Text style={styles.priceBreakdownSubItemPrice}>
                                                {drinkPrice > 0 ? `${drinkPrice.toFixed(2)} €` : 'Gratuit'}
                                              </Text>
                                            </View>
                                          </View>
                                        )}
                                      </View>
                                      
                                      {quantity > 1 && (
                                        <Text style={styles.orderItemUnitPrice}>
                                          {unitPrice.toFixed(2)} € × {quantity}
                                        </Text>
                                      )}
                                    </View>
                                    <View style={styles.orderItemPriceContainer}>
                                      <Text style={styles.orderItemPrice}>
                                        {lineTotal.toFixed(2)} €
                                      </Text>
                                      {quantity > 1 && (
                                        <Text style={styles.orderItemUnitPriceLabel}>
                                          ({unitPrice.toFixed(2)} € l'unité)
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                );
                              });
                            } else {
                              return (
                                <Text style={styles.noItemsText}>Aucun article dans cette commande</Text>
                              );
                            }
                          })()}
                        </View>

                        {/* Récapitulatif financier */}
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailsSectionTitle}>Récapitulatif</Text>
                          <Row label="Sous-total HT" value={`${Number(details.subtotal||0).toFixed(2)} €`} />
                          <Row label="Frais de livraison" value={`${Number(details.deliveryFee||0).toFixed(2)} €`} />
                          <Row label="TVA (si applicable)" value={`${Number(details.tax||0).toFixed(2)} €`} />
                          <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL TTC</Text>
                            <Text style={styles.totalAmount}>
                              {Number(details.total||0).toFixed(2)} €
                            </Text>
                          </View>
                        </View>

                        {/* Notes */}
                        {details.notes && (
                          <View style={styles.detailsSection}>
                            <Text style={styles.detailsSectionTitle}>Notes</Text>
                            <Text style={styles.notesText}>{details.notes}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.detailsError}>
                        <Text style={styles.detailsErrorText}>Impossible de charger les détails</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              );
            });
          })()}

          <View style={{ height: 16 }} />
        </View>

        <Footer onContact={() => navigation.getParent()?.navigate('Contact')} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'theme.background.light',
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    backgroundColor: 'theme.background.light',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: 'theme.background.white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'theme.text.primary',
  },
  restaurantName: {
    fontSize: 16,
    color: 'theme.text.primary',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: 'theme.text.secondary',
    marginBottom: 10,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'theme.background.border',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  detailsButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  detailsButtonText: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  banner: {
    backgroundColor: '#e6fffa',
    borderWidth: 1,
    borderColor: '#b2f5ea',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerText: { color: '#065f46', fontWeight: '700' },
  bannerClose: { color: '#065f46', fontWeight: '700' },
  // Styles pour les filtres
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
    marginTop: 10,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'theme.text.secondary',
  },
  filterTextActive: {
    color: 'theme.background.white',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'theme.text.tertiary',
    textAlign: 'center',
  },
  // Styles pour le temps estimé
  estimatedTimeContainer: {
    backgroundColor: 'theme.background.white3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedTimeLabel: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  estimatedTimeValue: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '700',
  },
  // Styles pour le dropdown des détails
  orderDetailsDropdown: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'theme.background.border',
  },
  detailsLoader: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  detailsLoaderText: {
    color: 'theme.text.secondary',
    fontSize: 14,
  },
  detailsContent: {
    paddingBottom: 10,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'theme.text.primary',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsLabel: {
    fontSize: 14,
    color: 'theme.text.secondary',
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    color: 'theme.text.primary',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemQty: {
    color: 'theme.text.primary',
    fontWeight: '700',
    fontSize: 14,
    width: 30,
    textAlign: 'center',
  },
  orderItemInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  orderItemName: {
    color: 'theme.text.primary',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  orderItemOpts: {
    color: 'theme.text.secondary',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  orderItemPriceContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  orderItemPrice: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'right',
  },
  orderItemPriceInfo: {
    marginTop: 4,
  },
  priceBreakdown: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceBreakdownLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'theme.text.primary',
    textTransform: 'uppercase',
  },
  priceBreakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22c55e',
  },
  priceBreakdownSection: {
    marginTop: 6,
    marginBottom: 4,
  },
  priceBreakdownSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  priceBreakdownSubItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
    marginTop: 2,
    paddingLeft: 4,
  },
  priceBreakdownSubItemText: {
    fontSize: 11,
    color: 'theme.text.secondary',
    flex: 1,
  },
  priceBreakdownSubItemPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
  },
  orderItemUnitPrice: {
    color: 'theme.text.tertiary',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderItemUnitPriceLabel: {
    color: 'theme.text.tertiary',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  noItemsText: {
    fontSize: 14,
    color: 'theme.text.tertiary',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#22c55e',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: 'theme.text.primary',
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#22c55e',
  },
  notesText: {
    fontSize: 14,
    color: 'theme.text.secondary',
    lineHeight: 20,
    marginTop: 8,
  },
  detailsError: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsErrorText: {
    color: 'theme.error',
    fontSize: 14,
  },
  // Styles réutilisés pour le récapitulatif (anciennement modalRow)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'theme.background.white',
    borderRadius: 20,
    maxHeight: '90%',
    width: '95%',
    maxWidth: 500,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
    flexDirection: 'column',
    display: 'flex',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#22c55e',
    flexShrink: 0,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  modalInvoiceTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#22c55e',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalOrderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: 'theme.text.primary',
  },
  modalInvoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  modalInvoiceSection: {
    flex: 1,
  },
  modalInvoiceLabel: {
    fontSize: 11,
    color: 'theme.text.tertiary',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  modalInvoiceValue: {
    fontSize: 14,
    color: 'theme.text.primary',
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: 10,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: 30,
  },
  modalContent: {
    padding: 20,
    paddingTop: 10,
    width: '100%',
  },
  modalLoader: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Style facture - Tableau des articles
  modalItemsTable: {
    marginBottom: 20,
  },
  modalTableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  modalTableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'theme.text.secondary',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTableDivider: {
    height: 2,
    backgroundColor: 'theme.background.border',
    marginVertical: 12,
  },
  modalTableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modalTableRowDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 4,
  },
  modalTableQty: {
    color: 'theme.text.primary',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  modalTableItemName: {
    color: 'theme.text.primary',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  modalTableItemOpts: {
    color: 'theme.text.secondary',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  modalTablePrice: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 15,
  },
  modalTotalsBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalRowLabel: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  modalRowValue: {
    color: 'theme.text.primary',
    fontWeight: '700',
    fontSize: 14,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#22c55e',
  },
  modalTotalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: 'theme.text.primary',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalTotalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#22c55e',
  },
  modalNotesBox: {
    backgroundColor: 'theme.background.white3e0',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  modalNotesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalNotesText: {
    fontSize: 14,
    color: 'theme.text.secondary',
    lineHeight: 20,
  },
  modalNoItems: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNoItemsText: {
    fontSize: 14,
    color: 'theme.text.tertiary',
    fontStyle: 'italic',
  },
});

export default OrdersScreen;
