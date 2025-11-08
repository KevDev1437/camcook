import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const AdminSettingsScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const [theme, setTheme] = useState('light');
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
      if (settings.theme) setTheme(settings.theme);
      if (typeof settings.notifications === 'boolean') setNotifications(settings.notifications);
    } catch (e) {
      console.log('Error loading settings', e);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (next) => {
    try {
      const payload = { theme, notifications, ...next };
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
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        onNotifications={() => navigation.navigate('AdminOrders')} 
        notificationCount={0} 
        onProfile={() => navigation.navigate('Profile')} 
        onLogout={logout}
      />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Paramètres</Text>
        
        {/* Paramètres personnels */}
        <View style={styles.card}>
          <Text style={styles.row}>Thème: {theme === 'dark' ? 'Sombre' : 'Clair'}</Text>
          <View style={styles.rowSwitch}>
            <Text style={styles.row}>Notifications</Text>
            <Switch value={notifications} onValueChange={(v) => { setNotifications(v); persist({ notifications: v }); }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'theme.background.light' },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: 'theme.text.primary' },
  card: { backgroundColor: 'theme.background.white', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: 'theme.background.border' },
  row: { color: 'theme.text.primary', marginBottom: 8 },
  rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'theme.text.secondary', fontSize: 16 },
});

export default AdminSettingsScreen;
