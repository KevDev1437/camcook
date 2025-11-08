import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Switch, TouchableOpacity, Alert } from 'react-native';
import Header from '../../components/Header';
// import api from '../../config/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getThemeColors } from '../../config/theme';
import { adminService } from '../../services/adminService';

const AdminUsersScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout, user: me } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminService.getUsers();
        setUsers(data);
      } catch (e) {
        console.log('Admin users error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setLocalUser = (id, updater) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...(typeof updater === 'function' ? updater(u) : updater) } : u)));
  };

  const onToggleActive = async (u) => {
    const next = !u.isActive;
    if (me?.id === u.id) {
      return Alert.alert('Sécurité', 'Vous ne pouvez pas modifier votre propre statut.');
    }
    setLocalUser(u.id, { isActive: next });
    try {
      await adminService.updateUser(u.id, { isActive: next });
    } catch (e) {
      setLocalUser(u.id, { isActive: !next });
      Alert.alert('Utilisateurs', 'Impossible de mettre à jour le statut');
    }
  };

  const onChangeRole = async (u, role) => {
    if (u.role === role) return;
    if (me?.id === u.id && role !== 'superadmin') {
      return Alert.alert('Sécurité', 'Vous ne pouvez pas retirer votre propre rôle superadmin.');
    }
    const old = u.role;
    setLocalUser(u.id, { role });
    try {
      await adminService.updateUser(u.id, { role });
    } catch (e) {
      setLocalUser(u.id, { role: old });
      Alert.alert('Utilisateurs', 'Échec du changement de rôle');
    }
  };

  const onDeleteUser = async (u) => {
    if (me?.id === u.id) {
      return Alert.alert('Sécurité', 'Vous ne pouvez pas supprimer votre propre compte.');
    }
    Alert.alert(
      'Supprimer',
      `Supprimer l’utilisateur ${u.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            // Optimistic remove
            const prev = users;
            setUsers((p) => p.filter((x) => x.id !== u.id));
            try {
              await adminService.deleteUser(u.id);
            } catch (e) {
              setUsers(prev);
              Alert.alert('Utilisateurs', 'Échec de la suppression');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.light }]}>
  <Header 
    onNotifications={() => navigation.navigate('AdminOrders')} 
    notificationCount={0} 
    onProfile={() => navigation.navigate('AdminProfile')} 
    onLogout={logout}
    onReviews={() => navigation.navigate('AdminReviews')}
    onContacts={() => navigation.navigate('AdminContacts')}
    showAdminActions={true}
  />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Utilisateurs</Text>
        {loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          users.map((u) => (
            <View key={u.id} style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{u.name}</Text>
                  <Text style={styles.email}>{u.email}</Text>
                </View>
                <View style={styles.activeWrap}>
                  <Text style={styles.activeLabel}>{u.isActive ? 'Actif' : 'Inactif'}</Text>
                  <Switch value={!!u.isActive} onValueChange={() => onToggleActive(u)} disabled={me?.id === u.id} />
                </View>
              </View>

              <View style={styles.rolesRow}>
                <RoleButton label="Client" active={u.role === 'customer'} onPress={() => onChangeRole(u, 'customer')} theme={theme} />
                <RoleButton label="Admin Restaurant" active={u.role === 'adminrestaurant'} onPress={() => onChangeRole(u, 'adminrestaurant')} theme={theme} />
                <RoleButton label="Super Admin" active={u.role === 'superadmin'} onPress={() => onChangeRole(u, 'superadmin')} theme={theme} />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>ID: {u.id}</Text>
                <Text style={styles.meta}>Créé: {new Date(u.createdAt).toLocaleDateString()}</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteUser(u)}>
                  <Text style={styles.deleteText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const RoleButton = ({ label, active, onPress, theme }) => (
  <TouchableOpacity style={[styles.roleBtn, { backgroundColor: (theme.background.white || '#fff') }, active && [styles.roleBtnActive, { borderColor: theme.primary, backgroundColor: theme.primary }]]} onPress={onPress}>
    <Text style={[styles.roleBtnText, { color: theme.text.primary }, active && { color: (theme.background.white || '#fff') }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#111', fontWeight: '700', fontSize: 16 },
  email: { marginTop: 2 },
  activeWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeLabel: { marginRight: 6 },
  rolesRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  roleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#ddd' },
  roleBtnActive: { },
  roleBtnText: { fontWeight: '700' },
  roleBtnTextActive: { },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  meta: { fontSize: 12 },
  actionsRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  deleteText: { fontWeight: '700' },
});

export default AdminUsersScreen;
