import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getThemeColors } from '../../config/theme';

const AdminSettingsScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [themeMode, setThemeMode] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsRes = await api.get('/admin/settings').catch(() => ({ data: { data: {} } }));
      
      const settings = settingsRes?.data?.data || {};
      if (settings.theme) setThemeMode(settings.theme);
      if (typeof settings.notifications === 'boolean') setNotifications(settings.notifications);
    } catch (e) {
      console.log('Error loading settings', e);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (next) => {
    try {
      const payload = { theme: themeMode, notifications, ...next };
      const res = await api.put('/admin/settings', payload);
      if (!res?.data?.success) throw new Error('Erreur de sauvegarde');
      Alert.alert('Paramètres', 'Sauvegardé');
    } catch (e) {
      Alert.alert('Paramètres', 'Erreur lors de la sauvegarde');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          onNotifications={() => navigation.navigate('AdminOrders')} 
          notificationCount={0} 
          onProfile={() => navigation.navigate('AdminProfile')} 
          onLogout={logout}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: (theme.text.secondary || '#666') }]}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.light }]}>
      <Header 
        onNotifications={() => navigation.navigate('AdminOrders')} 
        notificationCount={0} 
        onProfile={() => navigation.navigate('Profile')} 
        onLogout={logout}
      />
      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Paramètres</Text>
        
        {/* Paramètres personnels */}
        <View style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
          <Text style={[styles.row, { color: theme.text.primary }]}>Thème: {themeMode === 'dark' ? 'Sombre' : 'Clair'}</Text>
          <View style={styles.rowSwitch}>
            <Text style={[styles.row, { color: theme.text.primary }]}>Notifications</Text>
            <Switch value={notifications} onValueChange={(v) => { setNotifications(v); persist({ notifications: v }); }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  card: { borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1 },
  row: { marginBottom: 8 },
  rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
});

export default AdminSettingsScreen;
