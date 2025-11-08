import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { adminService } from '../../services/adminService';
import { useNotifications } from '../../context/NotificationContext';

const AdminPaymentsScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  // Le contexte filtre déjà les messages pour les admins
  const { 
    notifications: generalNotifications, // Déjà filtrées (sans messages)
    messageNotificationCount: unreadMessagesCount, // Compteur de messages
    notificationCount: generalNotificationCount // Compteur sans messages
  } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // all, succeeded, pending, failed, canceled

  const fetchPayments = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await adminService.getPayments(params);
      setPayments(data);
    } catch (error) {
      console.error('Erreur récupération paiements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      case 'canceled':
        return '#6b7280';
      case 'requires_action':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'succeeded':
        return '✅ Réussi';
      case 'pending':
        return '⏳ En attente';
      case 'failed':
        return '❌ Échoué';
      case 'canceled':
        return '🚫 Annulé';
      case 'requires_action':
        return '🔐 Action requise';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'apple_pay':
        return '🍎';
      case 'google_pay':
        return '📱';
      default:
        return '💳';
    }
  };

  const FilterButton = ({ value, label, active }) => (
    <TouchableOpacity
      style={[styles.filterBtn, active && styles.filterBtnActive]}
      onPress={() => setStatusFilter(value)}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        onCart={() => navigation.navigate('AdminDashboard')}
        cartCount={count}
              notifications={generalNotifications}
              notificationCount={generalNotificationCount}
        onProfile={() => navigation.navigate('AdminProfile')}
        onLogout={logout}
        onReviews={() => navigation.navigate('AdminReviews')}
        onContacts={() => navigation.navigate('AdminContacts')}
        unreadMessagesCount={unreadMessagesCount}
        showAdminActions={true}
      />
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchPayments} />}
      >
        <Text style={styles.title}>Paiements</Text>

        {/* Filtres */}
        <View style={styles.filters}>
          <FilterButton value="all" label="Tous" active={statusFilter === 'all'} />
          <FilterButton value="succeeded" label="Réussis" active={statusFilter === 'succeeded'} />
          <FilterButton value="pending" label="En attente" active={statusFilter === 'pending'} />
          <FilterButton value="failed" label="Échoués" active={statusFilter === 'failed'} />
          <FilterButton value="canceled" label="Annulés" active={statusFilter === 'canceled'} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Chargement des paiements...</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="payment" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucun paiement trouvé</Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentMethod}>
                      {getPaymentMethodIcon(payment.paymentMethod)} {payment.paymentMethod.toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + '20' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                        {getStatusLabel(payment.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.amount}>
                    {payment.amount.toFixed(2)} {payment.currency}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(payment.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {/* Informations de commande */}
              {payment.order && (
                <View style={styles.orderInfo}>
                  <View style={styles.orderRow}>
                    <MaterialIcons name="receipt" size={16} color="#666" />
                    <Text style={styles.orderText}>
                      Commande #{payment.order.orderNumber}
                    </Text>
                  </View>
                  {payment.order.customer && (
                    <View style={styles.orderRow}>
                      <MaterialIcons name="person" size={16} color="#666" />
                      <Text style={styles.orderText}>
                        {payment.order.customer.name || payment.order.customer.email}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.orderStatus}>
                    Statut: {payment.order.status}
                  </Text>
                </View>
              )}

              {/* ID du Payment Intent */}
              <View style={styles.paymentIdContainer}>
                <Text style={styles.paymentIdLabel}>Payment Intent ID:</Text>
                <Text style={styles.paymentId} numberOfLines={1} ellipsizeMode="middle">
                  {payment.id}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  filterBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  orderInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  orderStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  paymentIdContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
  },
  paymentIdLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  paymentId: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default AdminPaymentsScreen;

