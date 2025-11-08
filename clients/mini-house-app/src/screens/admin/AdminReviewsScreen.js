import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import RatingComponent from '../../components/RatingComponent';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { adminService } from '../../services/adminService';

const AdminReviewsScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  const loadReviews = useCallback(async (opts = {}) => {
    const params = { ...opts };
    if (statusFilter !== 'all') params.status = statusFilter;
    const data = await adminService.getReviews(params);
    setReviews(data);
  }, [statusFilter]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadReviews({ limit: '100' });
      } catch (e) {
        console.log('Admin reviews error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadReviews]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadReviews({ limit: '100' });
    } catch (e) {
      console.log('Refresh reviews error', e);
    } finally {
      setRefreshing(false);
    }
  }, [loadReviews]);

  const handleApprove = async (id) => {
    try {
      // Optimistic: update UI immediately
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r).filter(r => statusFilter === 'pending' ? r.id !== id : true));
    
      await adminService.updateReviewStatus(id, 'approved');
    } catch (e) {
      console.log('Approve review error', e);
      // Recharger pour cohérence si erreur
      await onRefresh();
    }
  };

  const handleReject = async (id) => {
    try {
      // Optimistic: update UI immediately
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r).filter(r => statusFilter === 'pending' ? r.id !== id : true));
      await adminService.updateReviewStatus(id, 'rejected');
    } catch (e) {
      console.log('Reject review error', e);
      await onRefresh();
    }
  };

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      onPress={() => setStatusFilter(value)}
      style={[styles.filterBtn, statusFilter === value && styles.filterBtnActive]}
    >
      <Text style={[styles.filterText, statusFilter === value && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
  <Header 
    onNotifications={() => navigation.navigate('AdminOrders')} 
    notificationCount={0} 
    onProfile={() => navigation.navigate('AdminProfile')} 
    onLogout={logout}
  />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Avis</Text>
          <View style={styles.filtersRow}>
            <FilterButton value="pending" label="En attente" />
            <FilterButton value="approved" label="Approuvés" />
            <FilterButton value="rejected" label="Rejetés" />
            <FilterButton value="all" label="Tous" />
          </View>
        </View>
        {loading ? (
          <ActivityIndicator color="#22c55e" />
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{r?.MenuItem?.name || 'Élément'}</Text>
                  {typeof r?.MenuItem?.price === 'number' && (
                    <Text style={styles.itemPrice}>{r.MenuItem.price.toFixed(2)} €</Text>
                  )}
                </View>
                <StatusBadge status={r.status} type="review" />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>Par: {r?.User?.name || 'Inconnu'}{r?.User?.email ? ` · ${r.User.email}` : ''}</Text>
              </View>

              <View style={styles.ratingRow}>
                <RatingComponent rating={r.rating} onRatingChange={() => {}} />
              </View>

              {r.text ? (
                <Text style={styles.reviewText}>{r.text}</Text>
              ) : (
                <Text style={styles.reviewTextMuted}>Aucun texte fourni.</Text>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  disabled={r.status === 'approved'}
                  onPress={() => handleApprove(r.id)}
                  style={[styles.actionBtn, styles.approveBtn, r.status === 'approved' && styles.btnDisabled]}
                >
                  <Text style={styles.actionText}>{r.status === 'approved' ? 'Approuvé' : 'Approuver'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={r.status === 'rejected'}
                  onPress={() => handleReject(r.id)}
                  style={[styles.actionBtn, styles.rejectBtn, r.status === 'rejected' && styles.btnDisabled]}
                >
                  <Text style={styles.actionText}>{r.status === 'rejected' ? 'Rejeté' : 'Refuser'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  headerRow: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10, color: '#333' },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 4,
  },
  filterBtnActive: { borderColor: '#22c55e', backgroundColor: '#22c55e15' },
  filterText: { color: '#333', fontWeight: '600' },
  filterTextActive: { color: '#22c55e' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#111' },
  itemPrice: { fontSize: 12, color: '#666' },
  metaRow: { marginBottom: 8 },
  meta: { color: '#666', fontSize: 12 },
  ratingRow: { alignItems: 'flex-start', marginBottom: 6 },
  reviewText: { color: '#333', lineHeight: 20 },
  reviewTextMuted: { color: '#999', fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: '700' },
  approveBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.6 },
});

export default AdminReviewsScreen;
