import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import KpiCard from '../../components/admin/KpiCard';
import StatusBadge from '../../components/admin/StatusBadge';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { adminService } from '../../services/adminService';

const screenWidth = Dimensions.get('window').width;

const COLORS = {
  pending: '#f59e0b',
  preparing: '#06b6d4',
  ready: '#22c55e',
  on_delivery: '#60a5fa',
  completed: '#10b981',
  cancelled: '#ef4444',
};

const AdminDashboardScreen = ({ navigation }) => {
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
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeCustomersCount, setActiveCustomersCount] = useState(0);
  const [periodFilter, setPeriodFilter] = useState('week'); // 'today' | 'week' | 'month' | 'custom'
  const [error, setError] = useState(null);
  const previousMetricsRef = useRef(null); // Pour calculer les tendances

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, reviewsRes, messagesRes, activeCustomersCountRes] = await Promise.all([
        adminService.getOrders({ limit: '200' }),
        adminService.getPendingReviews({ limit: '50' }),
        adminService.getMessages({ limit: '50' }),
        adminService.getActiveCustomersCount(),
      ]);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
      setMessages(Array.isArray(messagesRes) ? messagesRes : []);
      setActiveCustomersCount(activeCustomersCountRes || 0);
    } catch (err) {
      console.error('fetchAll error', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Erreur lors du chargement des données';
      setError(errorMessage);
      Alert.alert(
        'Erreur de chargement',
        errorMessage,
        [
          { text: 'Réessayer', onPress: () => fetchAll() },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Calculer les dates selon le filtre de période
  const getPeriodDates = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (periodFilter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        return { start: weekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(1);
        return { start: monthStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      default:
        const weekStartDefault = new Date(today);
        weekStartDefault.setDate(today.getDate() - 6);
        return { start: weekStartDefault, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
  }, [periodFilter]);

  // Calculer les dates de la période précédente pour comparaison
  const getPreviousPeriodDates = useCallback(() => {
    const { start, end } = getPeriodDates();
    const periodDuration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - periodDuration),
      end: start,
    };
  }, [getPeriodDates]);

  const metrics = useMemo(() => {
    const { start, end } = getPeriodDates();
    const { start: prevStart, end: prevEnd } = getPreviousPeriodDates();
    
    const isInPeriod = (date) => {
      const d = new Date(date);
      return !isNaN(d) && d >= start && d < end;
    };
    
    const isInPreviousPeriod = (date) => {
      const d = new Date(date);
      return !isNaN(d) && d >= prevStart && d < prevEnd;
    };

    // Revenu de la période actuelle
    const revenuePeriod = orders.reduce((sum, o) => {
      if (isInPeriod(o.createdAt)) return sum + (Number(o.total) || 0);
      return sum;
    }, 0);

    // Revenu de la période précédente
    const revenuePreviousPeriod = orders.reduce((sum, o) => {
      if (isInPreviousPeriod(o.createdAt)) return sum + (Number(o.total) || 0);
      return sum;
    }, 0);

    // Calcul du pourcentage de changement
    const revenueTrend = revenuePreviousPeriod > 0
      ? ((revenuePeriod - revenuePreviousPeriod) / revenuePreviousPeriod) * 100
      : 0;

    const statusCount = orders.reduce((acc, o) => {
      if (isInPeriod(o.createdAt)) {
        const s = (o.status || 'pending').toLowerCase();
        acc[s] = (acc[s] || 0) + 1;
      }
      return acc;
    }, {});

    // Compteurs pour la période actuelle
    const pendingReviews = Array.isArray(reviews) ? reviews.length : 0;
    const unreadMessages = messages.filter((m) => (m.status || 'new').toLowerCase() === 'new').length;
    const activeCustomers = activeCustomersCount;
    const completedOrders = (statusCount.completed || 0);

    // Compteurs pour la période précédente
    const previousCompletedOrders = orders.reduce((sum, o) => {
      if (isInPreviousPeriod(o.createdAt) && (o.status || '').toLowerCase() === 'completed') return sum + 1;
      return sum;
    }, 0);

    // Calcul des tendances
    const completedOrdersTrend = previousCompletedOrders > 0
      ? ((completedOrders - previousCompletedOrders) / previousCompletedOrders) * 100
      : 0;

    // Générer les jours pour le graphique selon la période
    const days = [];
    const series = [];
    const dayCount = periodFilter === 'today' ? 1 : periodFilter === 'week' ? 7 : 30;
    
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(key);
      const daySum = orders.reduce((sum, o) => {
        const od = new Date(o.createdAt);
        const ok = !isNaN(od) ? od.toISOString().slice(0, 10) : '';
        return ok === key ? sum + (Number(o.total) || 0) : sum;
      }, 0);
      series.push(+daySum.toFixed(2));
    }

    return {
      revenuePeriod,
      revenueTrend,
      statusCount,
      pendingReviews,
      unreadMessages,
      activeCustomers,
      completedOrders,
      completedOrdersTrend,
      days,
      series,
    };
  }, [orders, reviews, messages, activeCustomersCount, periodFilter, getPeriodDates, getPreviousPeriodDates]);

  // Sauvegarder les métriques précédentes pour calculer les tendances
  useEffect(() => {
    if (metrics && !loading) {
      previousMetricsRef.current = { ...metrics };
    }
  }, [metrics, loading]);

  const pieData = useMemo(() => {
    const sc = metrics.statusCount || {};
    const entries = Object.entries(sc).filter(([, v]) => v > 0);
    const toName = (k) => {
      switch (k) {
        case 'pending': return 'En attente';
        case 'preparing': return 'Préparation';
        case 'ready': return 'Prêt';
        case 'on_delivery': return 'En livraison';
        case 'completed': return 'Terminé';
        case 'cancelled': return 'Annulé';
        default: return k;
      }
    };
    return entries.map(([k, v], idx) => ({
      name: toName(k),
      population: v,
      color: COLORS[k] || ['#22c55e', '#06b6d4', '#22c55e', '#60a5fa', '#a78bfa', '#ef4444'][idx % 6],
      legendFontColor: '#777',
      legendFontSize: 12,
    }));
  }, [metrics.statusCount]);

  return (
    <View style={styles.container}>
      <Header
        onNotifications={() => navigation.navigate('AdminOrders')}
        notificationCount={generalNotificationCount}
        notifications={generalNotifications}
        onNotificationPress={(notif) => {
          markAsRead(notif.id);
          // Naviguer vers l'écran approprié selon le type de notification
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
      >
        <Text style={styles.title}>Dashboard</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Chargement des métriques…</Text>
          </View>
        ) : (
          <>
            {/* Filtres de période */}
            <View style={styles.periodFilters}>
              <TouchableOpacity
                style={[styles.periodButton, periodFilter === 'today' && styles.periodButtonActive]}
                onPress={() => setPeriodFilter('today')}
              >
                <Text style={[styles.periodButtonText, periodFilter === 'today' && styles.periodButtonTextActive]}>Aujourd'hui</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, periodFilter === 'week' && styles.periodButtonActive]}
                onPress={() => setPeriodFilter('week')}
              >
                <Text style={[styles.periodButtonText, periodFilter === 'week' && styles.periodButtonTextActive]}>7 jours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, periodFilter === 'month' && styles.periodButtonActive]}
                onPress={() => setPeriodFilter('month')}
              >
                <Text style={[styles.periodButtonText, periodFilter === 'month' && styles.periodButtonTextActive]}>Mois</Text>
              </TouchableOpacity>
            </View>

            {/* Message d'erreur */}
            {error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => fetchAll()}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* KPIs */}
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <KpiCard
                  title={periodFilter === 'today' ? 'Ventes du jour' : periodFilter === 'week' ? 'Ventes 7 jours' : 'Ventes du mois'}
                  value={`${metrics.revenuePeriod.toFixed(2)} €`}
                  icon="euro"
                  color="#22c55e"
                  onPress={() => navigation.navigate('AdminOrders')}
                  trend={previousMetricsRef.current ? { percentage: metrics.revenueTrend } : null}
                />
              </View>
              <View style={styles.gridItem}>
                <KpiCard title="Cmd en cours" value={`${(metrics.statusCount.preparing || 0) + (metrics.statusCount.ready || 0) + (metrics.statusCount.on_delivery || 0)}`} icon="local-shipping" color="#06b6d4" onPress={() => navigation.navigate('AdminOrders')} />
              </View>
              <View style={styles.gridItem}>
                <KpiCard title="Avis en attente" value={`${metrics.pendingReviews}`} icon="rate-review" color="#a78bfa" onPress={() => navigation.navigate('AdminReviews')} />
              </View>
              <View style={styles.gridItem}>
                <KpiCard title="Messages" value={`${metrics.unreadMessages}`} icon="mail" color="#60a5fa" onPress={() => navigation.navigate('AdminContacts')} />
              </View>
              <View style={styles.gridItem}>
                <KpiCard title="Clients actifs" value={`${metrics.activeCustomers}`} icon="people" color="#22c55e" onPress={() => navigation.navigate('AdminUsers')} />
              </View>
              <View style={styles.gridItem}>
                <KpiCard
                  title="Commandes livrées"
                  value={`${metrics.completedOrders}`}
                  icon="check-circle"
                  color="#22c55e"
                  onPress={() => navigation.navigate('AdminOrders')}
                  trend={previousMetricsRef.current ? { percentage: metrics.completedOrdersTrend } : null}
                />
              </View>
            </View>

            {/* Charts */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {periodFilter === 'today' ? 'Ventes du jour' : periodFilter === 'week' ? 'Ventes 7 derniers jours' : 'Ventes du mois'}
              </Text>
              <LineChart
                data={{ labels: metrics.days.map((d) => d.slice(5)), datasets: [{ data: metrics.series }] }}
                width={screenWidth - 32}
                height={200}
                yAxisSuffix="€"
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  labelColor: () => '#666',
                  propsForDots: { r: '3', strokeWidth: '1', stroke: '#22c55e' },
                }}
                bezier
                style={{ borderRadius: 12 }}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Répartition statuts</Text>
              {pieData.length ? (
                <PieChart
                  data={pieData}
                  width={screenWidth - 32}
                  height={200}
                  chartConfig={{
                    color: () => '#333',
                    labelColor: () => '#666',
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="16"
                  hasLegend
                />
              ) : (
                <Text style={styles.muted}>Pas de données</Text>
              )}
            </View>

            {/* Recents (liens supprimés) */}
            
            {orders.slice(0, 5).map((o) => (
              <View key={o.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowMain}>#{o.orderNumber} • {new Date(o.createdAt).toLocaleString()}</Text>
                  <Text style={styles.rowSub}>{(Number(o.total) || 0).toFixed(2)} €</Text>
                </View>
                <StatusBadge status={o.status} />
              </View>
            ))}

            


          </>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, color: '#333' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee', marginTop: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 8, color: '#333' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
  rowMain: { color: '#333', fontWeight: '600' },
  rowSub: { color: '#777', marginTop: 2 },
  muted: { color: '#999' },
  loadingBox: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { color: '#666', marginTop: 8 },
  // Menu editor styles
  menuCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
  menuName: { fontWeight: '800', color: '#333', marginBottom: 8 },
  menuRow: { flexDirection: 'row', gap: 10 },
  menuCol: { flex: 1 },
  menuColFull: { flex: 1 },
  menuLabel: { color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  saveBtn: { marginTop: 10, backgroundColor: '#22c55e', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800' },
  deleteBtn: { marginTop: 10, backgroundColor: '#ef4444', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: '800' },
  helperText: { fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' },
});

export default AdminDashboardScreen;
