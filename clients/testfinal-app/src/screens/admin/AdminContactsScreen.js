import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import StatusBadge from '../../components/admin/StatusBadge';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getThemeColors } from '../../config/theme';
import { adminService } from '../../services/adminService';

const AdminContactsScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('new'); // 'new' | 'read' | 'archived' | 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'restaurant' | 'problem'
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadMessages = useCallback(async () => {
    const params = { limit: '100' };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (search && search.trim()) params.q = search.trim();
    const data = await adminService.getMessages(params);
    setMessages(data);
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadMessages();
      } catch (e) {
        console.log('Admin contacts error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMessages]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadMessages();
    } catch (e) {
      console.log('Refresh contacts error', e);
    } finally {
      setRefreshing(false);
    }
  }, [loadMessages]);

  const updateStatusOptimistic = async (id, nextStatus) => {
    // Optimistic UI
    setMessages(prev => prev
      .map(m => (m.id === id ? { ...m, status: nextStatus } : m))
      .filter(m => (statusFilter === 'all' ? true : m.status === statusFilter))
    );
    try {
      await adminService.updateContactStatus(id, nextStatus);
      // reflect in modal if same item
      setSelected((cur) => (cur && cur.id === id ? { ...cur, status: nextStatus } : cur));
    } catch (e) {
      console.log('Update message status error', e);
      // Reload to recover from error
      await onRefresh();
    }
  };

  const FilterButton = ({ active, label, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.filterBtn, { backgroundColor: (theme.background.white || '#fff') }, active && { borderColor: theme.primary, backgroundColor: theme.primary + '15' }]}>
      <Text style={[styles.filterText, { color: theme.text.primary }, active && { color: theme.primary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background.light }]}>
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Messages de contact</Text>
          <View style={styles.filtersRow}>
            <FilterButton label="Nouveaux" active={statusFilter==='new'} onPress={() => setStatusFilter('new')} />
            <FilterButton label="Lus" active={statusFilter==='read'} onPress={() => setStatusFilter('read')} />
            <FilterButton label="Archivés" active={statusFilter==='archived'} onPress={() => setStatusFilter('archived')} />
            <FilterButton label="Tous" active={statusFilter==='all'} onPress={() => setStatusFilter('all')} />
          </View>
          <View style={styles.filtersRow}>
            <FilterButton label="Tous types" active={typeFilter==='all'} onPress={() => setTypeFilter('all')} />
            <FilterButton label="Restaurant" active={typeFilter==='restaurant'} onPress={() => setTypeFilter('restaurant')} />
            <FilterButton label="Problème" active={typeFilter==='problem'} onPress={() => setTypeFilter('problem')} />
          </View>
          <TextInput
            style={[styles.searchInput, { backgroundColor: (theme.background.white || '#fff'), borderColor: '#e0e0e0', color: theme.text.primary }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher nom, email ou contenu..."
            onSubmitEditing={loadMessages}
            returnKeyType="search"
          />
        </View>
        {loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          messages.map((m) => (
            <TouchableOpacity key={m.id} style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]} onPress={() => { setSelected(m); setModalVisible(true); }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nameEmail}>{m.name} • {m.email}</Text>
                  <Text style={[styles.typeText, { color: (theme.text.secondary || '#666') }]}>{m.type === 'problem' ? 'Problème signalé' : 'Contacter le restaurant'}</Text>
                </View>
                <StatusBadge status={m.status} />
              </View>
              <Text style={[styles.messageText, { color: theme.text.primary }]}>{m.message}</Text>
              <View style={styles.actionsRow}>
                {m.status !== 'read' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => updateStatusOptimistic(m.id, 'read')}>
                    <Text style={[styles.actionText, { color: (theme.background.white || '#fff') }]}>Marquer lu</Text>
                  </TouchableOpacity>
                )}
                {m.status !== 'archived' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6b7280' }]} onPress={() => updateStatusOptimistic(m.id, 'archived')}>
                    <Text style={[styles.actionText, { color: (theme.background.white || '#fff') }]}>Archiver</Text>
                  </TouchableOpacity>
                )}
                {m.status !== 'new' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.warning }]} onPress={() => updateStatusOptimistic(m.id, 'new')}>
                    <Text style={[styles.actionText, { color: (theme.background.white || '#fff') }]}>Marquer nouveau</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        {/* Detail Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {selected ? (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Message de {selected.name}</Text>
                    <StatusBadge status={selected.status} />
                  </View>
                  <Text style={styles.modalSub}>{selected.email} • {selected.type === 'problem' ? 'Problème' : 'Restaurant'}</Text>
                  {selected.createdAt && (
                    <Text style={styles.modalDate}>{new Date(selected.createdAt).toLocaleString()}</Text>
                  )}
                  <ScrollView style={styles.modalBody}>
                    <Text style={styles.modalMessage}>{selected.message}</Text>
                  </ScrollView>
                  <View style={styles.modalActions}>
                    {selected.status !== 'read' && (
                      <TouchableOpacity style={[styles.actionBtn, styles.markReadBtn]} onPress={() => updateStatusOptimistic(selected.id, 'read')}>
                        <Text style={styles.actionText}>Marquer lu</Text>
                      </TouchableOpacity>
                    )}
                    {selected.status !== 'archived' && (
                      <TouchableOpacity style={[styles.actionBtn, styles.archiveBtn]} onPress={() => updateStatusOptimistic(selected.id, 'archived')}>
                        <Text style={styles.actionText}>Archiver</Text>
                      </TouchableOpacity>
                    )}
                    {selected.status !== 'new' && (
                      <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={() => updateStatusOptimistic(selected.id, 'new')}>
                        <Text style={styles.actionText}>Marquer nouveau</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#111' }]} onPress={() => setModalVisible(false)}>
                      <Text style={styles.actionText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={{ color: theme.text.primary }}>Aucun message sélectionné.</Text>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  headerRow: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ddd', marginRight: 8, marginBottom: 4 },
  filterText: { fontWeight: '600' },
  searchInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  card: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  nameEmail: { fontSize: 15, fontWeight: '700', color: '#111' },
  typeText: { fontSize: 12 },
  messageText: { lineHeight: 20 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionText: { fontWeight: '700' },
});

export default AdminContactsScreen;
