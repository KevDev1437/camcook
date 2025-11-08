import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import StatusBadge from '../../components/admin/StatusBadge';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { adminService } from '../../services/adminService';

const AdminOrdersScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  // Le contexte filtre déjà les messages pour les admins
  const { 
    notifications: generalNotifications, // Déjà filtrées (sans messages)
    messageNotifications, // Messages séparés
    notificationCount: generalNotificationCount, // Compteur sans messages
    messageNotificationCount: unreadMessagesCount, // Compteur de messages
    onNotificationPress, 
    markAsRead, 
    clearNotification 
  } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('recu'); // recu | en_cours | livrer | annuler | refuse | all
  const [newBanner, setNewBanner] = useState(null); // { orderNumber }
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [currentTime, setCurrentTime] = useState(new Date()); // Pour le décompte en temps réel
  const lastSeenRef = useRef({}); // map id->true for seen pending

  const fetchOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await adminService.getOrders(params);
      setOrders(data);

      // Detect new pending orders for banner
      const pending = data.filter(o => o.status === 'pending');
      const unseen = pending.find(o => !lastSeenRef.current[o.id]);
      if (unseen) {
        setNewBanner({ orderNumber: unseen.orderNumber });
        // mark all current pending as seen
        pending.forEach(p => { lastSeenRef.current[p.id] = true; });
      }
    } catch (e) {
      console.log('Admin orders error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Polling for new orders every 10s
  useEffect(() => {
    const id = setInterval(() => { fetchOrders(); }, 10000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  // Mettre à jour le temps actuel toutes les secondes pour le décompte en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Mise à jour toutes les secondes pour un décompte fluide (comme une montre)
    
    return () => clearInterval(timer);
  }, []);

  const updateStatus = async (id, status, minutes = null) => {
    try {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      await adminService.updateOrderStatus(id, status, minutes);
    } catch (e) {
      console.log('Update order status error', e);
      await fetchOrders();
    }
  };

  const handleStartPreparation = (orderId) => {
    setSelectedOrderId(orderId);
    setEstimatedMinutes('30'); // Valeur par défaut : 30 minutes
    setTimeModalVisible(true);
  };

  const confirmStartPreparation = () => {
    const minutes = parseInt(estimatedMinutes, 10);
    if (!minutes || minutes <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un temps valide (en minutes)');
      return;
    }
    setTimeModalVisible(false);
    updateStatus(selectedOrderId, 'preparing', minutes);
    setSelectedOrderId(null);
  };

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity onPress={() => setStatusFilter(value)} style={[styles.filterBtn, statusFilter === value && styles.filterBtnActive]}>
      <Text style={[styles.filterText, statusFilter === value && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
  <Header 
    onNotifications={() => navigation.navigate('AdminOrders')}
    notificationCount={generalNotificationCount}
    notifications={generalNotifications}
    onNotificationPress={(notif) => {
      markAsRead(notif.id);
      if (notif.type === 'new_order' && notif.orderId) {
        navigation.navigate('AdminOrders');
      } else if (notif.type === 'new_message' && notif.messageId) {
        navigation.navigate('AdminContacts');
      } else if (notif.type === 'new_review' && notif.reviewId) {
        navigation.navigate('AdminReviews');
      } else if (notif.type === 'new_user' && notif.userId) {
        navigation.navigate('AdminUsers');
      }
    }}
    onDeleteNotification={(notificationId) => {
      clearNotification(notificationId);
    }}
    onProfile={() => navigation.navigate('AdminProfile')} 
    onLogout={logout}
    onReviews={() => navigation.navigate('AdminReviews')}
    onContacts={() => navigation.navigate('AdminContacts')}
    unreadMessagesCount={unreadMessagesCount}
    showAdminActions={true}
  />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
      >
        <Text style={styles.title}>Commandes</Text>

        {/* New order banner */}
        {newBanner && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Nouvelle commande reçue • #{newBanner.orderNumber}</Text>
            <TouchableOpacity onPress={() => setNewBanner(null)}><Text style={styles.bannerClose}>Fermer</Text></TouchableOpacity>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filtersRow}>
          <FilterButton value="recu" label="Reçues" />
          <FilterButton value="en_cours" label="En cours" />
          <FilterButton value="livrer" label="Livrées" />
          <FilterButton value="annuler" label="Annulées" />
          <FilterButton value="refuse" label="Refusées" />
          <FilterButton value="all" label="Toutes" />
        </View>

        {loading ? (
          <ActivityIndicator color="#22c55e" />
        ) : (
          orders.map((o) => (
            <View key={o.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNum}>#{o.orderNumber}</Text>
                  {o.orderGroupId && (
                    <Text style={{ fontSize: 11, color: '#6366f1', marginBottom: 2 }}>
                      📦 Groupe: {o.orderGroupId}
                    </Text>
                  )}
                  {o.customer && (
                    <Text style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                      👤 Client: {o.customer.name || o.customer.email || 'Inconnu'}
                    </Text>
                  )}
                  <Text style={styles.orderMeta}>{new Date(o.createdAt).toLocaleString()} • {(Number(o.total)||0).toFixed(2)} € • {o.orderType === 'delivery' ? 'Livraison' : 'À emporter'}</Text>
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
                  {/* Informations de paiement */}
                  <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#666', marginRight: 8 }}>
                      Paiement: {
                        o.paymentStatus === 'paid' ? '✅ Payé' :
                        o.paymentStatus === 'pending' ? '⏳ En attente' :
                        o.paymentStatus === 'failed' ? '❌ Échoué' :
                        o.paymentStatus === 'refunded' ? '↩️ Remboursé' :
                        '❓ Inconnu'
                      }
                    </Text>
                    {o.paymentMethod && (
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        • {
                          o.paymentMethod === 'stripe_card' ? '💳 Carte' :
                          o.paymentMethod === 'stripe_apple_pay' ? '🍎 Apple Pay' :
                          o.paymentMethod === 'stripe_google_pay' ? '📱 Google Pay' :
                          o.paymentMethod === 'cash' ? '💵 Espèces' :
                          o.paymentMethod === 'card' ? '💳 Carte' :
                          o.paymentMethod === 'mobile_money' ? '📱 Mobile Money' :
                          o.paymentMethod
                        }
                      </Text>
                    )}
                  </View>
                </View>
                <StatusBadge status={o.status} type="order" />
              </View>

              {/* Items */}
              {Array.isArray(o.items) && o.items.length > 0 && (
                <View style={styles.itemsBox}>
                  {o.items.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>x{it.quantity || 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{it.name || 'Article'}</Text>
                        {it.options && (
                          <Text style={styles.itemOpts}>
                            {(() => {
                              const acc = Array.isArray(it.options.accompagnements) ? it.options.accompagnements : [];
                              const drink = it.options.boisson ? ` • Boisson: ${it.options.boisson}` : '';
                              const accStr = acc.length ? `Accompagnements: ${acc.join(', ')}` : '';
                              return `${accStr}${drink}`.replace(/^\s+|\s+$/g, '');
                            })()}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.itemPrice}>{Number(it.price || it.unitPrice || 0).toFixed(2)} €</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsRow}>
                {o.status === 'pending' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => updateStatus(o.id, 'confirmed')}>
                    <Text style={styles.actionText}>Confirmer</Text>
                  </TouchableOpacity>
                )}
                {o.status === 'pending' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => updateStatus(o.id, 'rejected')}>
                    <Text style={styles.actionText}>Refuser</Text>
                  </TouchableOpacity>
                )}
                {o.status === 'confirmed' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.processBtn]} onPress={() => handleStartPreparation(o.id)}>
                    <Text style={styles.actionText}>Commencer</Text>
                  </TouchableOpacity>
                )}
                {o.status === 'preparing' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.processBtn]} onPress={() => updateStatus(o.id, 'ready')}>
                    <Text style={styles.actionText}>Prête</Text>
                  </TouchableOpacity>
                )}
                {o.status === 'ready' && o.orderType === 'delivery' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.processBtn]} onPress={() => updateStatus(o.id, 'on_delivery')}>
                    <Text style={styles.actionText}>En livraison</Text>
                  </TouchableOpacity>
                )}
                {(o.status === 'ready' || o.status === 'on_delivery') && (
                  <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => updateStatus(o.id, 'completed')}>
                    <Text style={styles.actionText}>Terminer</Text>
                  </TouchableOpacity>
                )}
                {o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'rejected' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => updateStatus(o.id, 'cancelled')}>
                    <Text style={styles.actionText}>Annuler</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal pour saisir le temps estimé de préparation */}
      <Modal
        visible={timeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTimeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Temps estimé de préparation</Text>
            <Text style={styles.modalSubtitle}>
              Dans combien de minutes la commande sera-t-elle prête ?
            </Text>
            
            <TextInput
              style={styles.timeInput}
              placeholder="30"
              keyboardType="numeric"
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
              autoFocus={true}
            />
            <Text style={styles.modalHint}>Temps en minutes</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setTimeModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmStartPreparation}
              >
                <Text style={styles.modalButtonTextConfirm}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#333' },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  filterBtnActive: { borderColor: '#22c55e', backgroundColor: '#22c55e15' },
  filterText: { color: '#333', fontWeight: '600' },
  filterTextActive: { color: '#22c55e' },
  banner: { backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#ffecb3', padding: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bannerText: { color: '#8d6e63', fontWeight: '700' },
  bannerClose: { color: '#8d6e63', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  orderNum: { fontSize: 16, fontWeight: '800', color: '#111' },
  orderMeta: { fontSize: 12, color: '#666' },
  itemsBox: { backgroundColor: '#fafafa', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#f0f0f0', marginTop: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  itemQty: { color: '#333', width: 26, fontWeight: '700' },
  itemName: { color: '#333', fontWeight: '700' },
  itemOpts: { color: '#666', fontSize: 12 },
  itemPrice: { color: '#22c55e', fontWeight: '700', minWidth: 70, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: '700' },
  approveBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  processBtn: { backgroundColor: '#3b82f6' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeInput: {
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#22c55e',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontWeight: '700',
    fontSize: 16,
  },
  modalButtonTextConfirm: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // Styles pour le temps estimé
  estimatedTimeContainer: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
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
});

export default AdminOrdersScreen;
