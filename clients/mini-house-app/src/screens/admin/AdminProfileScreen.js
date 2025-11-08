import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getThemeColors } from '../../config/theme';

const AdminProfileScreen = ({ navigation }) => {
  const { user: currentUser, logout } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const { count } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Récupérer les infos complètes du profil
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        const userData = res.data.data;
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      } else {
        // Fallback vers les données du contexte
        setFormData({
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          phone: currentUser?.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback vers les données du contexte
      setFormData({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const settingsRes = await api.get('/admin/settings').catch(() => ({ data: { data: {} } }));
      const settingsData = settingsRes?.data?.data || {};
      setSettings({
        theme: settingsData.theme || 'light',
        notifications: typeof settingsData.notifications === 'boolean' ? settingsData.notifications : true,
      });
    } catch (e) {
      console.log('Error loading settings', e);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSettings = async (updates) => {
    try {
      const payload = { ...settings, ...updates };
      const res = await api.put('/admin/settings', payload);
      if (!res?.data?.success) throw new Error('Erreur de sauvegarde');
      setSettings(payload);
      Alert.alert('Succès', 'Paramètres sauvegardés');
    } catch (e) {
      console.error('Error saving settings', e);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Validation', 'Le nom est requis');
        return;
      }
      if (!formData.email.trim()) {
        Alert.alert('Validation', 'L\'email est requis');
        return;
      }
      if (!formData.phone.trim()) {
        Alert.alert('Validation', 'Le téléphone est requis');
        return;
      }

      // Vérifier format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        Alert.alert('Validation', 'Format d\'email invalide');
        return;
      }

      setSaving(true);
      
      // Mettre à jour le profil via l'endpoint user
      const res = await api.put('/users/profile', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      if (res.data?.success) {
        Alert.alert('Succès', 'Profil mis à jour');
        // Recharger le profil
        await loadProfile();
      } else {
        throw new Error(res.data?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', error?.response?.data?.message || error?.message || 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordData.currentPassword.trim()) {
        Alert.alert('Validation', 'Le mot de passe actuel est requis');
        return;
      }
      if (!passwordData.newPassword.trim()) {
        Alert.alert('Validation', 'Le nouveau mot de passe est requis');
        return;
      }
      if (passwordData.newPassword.length < 6) {
        Alert.alert('Validation', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        Alert.alert('Validation', 'Les mots de passe ne correspondent pas');
        return;
      }

      setChangingPassword(true);
      
      const res = await api.put('/users/profile', {
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword,
      });

      if (res.data?.success) {
        Alert.alert('Succès', 'Mot de passe modifié');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(res.data?.message || 'Erreur lors de la modification du mot de passe');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Erreur', error?.response?.data?.message || error?.message || 'Impossible de modifier le mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  // Obtenir les initiales du nom
  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.light }]}>
        <Header
          onNotifications={() => navigation.navigate('AdminOrders')}
          notificationCount={0}
          onProfile={() => {}}
          onLogout={logout}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: (theme.text.secondary || '#666') }]}>Chargement du profil...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background.light }]}>
      <Header
        onNotifications={() => navigation.navigate('AdminOrders')}
        notificationCount={0}
        onProfile={() => {}}
        onLogout={logout}
      />
      {navigation.canGoBack() && (
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: (theme.background.white || '#fff'), borderBottomColor: theme.background.border }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text.primary} />
          <Text style={[styles.backButtonText, { color: theme.text.primary }]}>Retour</Text>
        </TouchableOpacity>
      )}
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.header, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: (theme.background.white || '#fff') }]}>
              {getInitials(formData.name)}
            </Text>
          </View>
          <Text style={[styles.userName, { color: theme.text.primary }]}>{formData.name || 'Admin'}</Text>
          <Text style={[styles.userEmail, { color: (theme.text.secondary || '#666') }]}>{formData.email || ''}</Text>
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.badgeText, { color: (theme.background.white || '#fff') }]}>ADMIN</Text>
          </View>
        </View>

        {/* Informations du profil */}
        <View style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Informations du profil</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Votre nom"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+33612345678"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            <Text style={[styles.saveButtonText, { color: (theme.background.white || '#fff') }]}>
              {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modification du mot de passe */}
        <View style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Modifier le mot de passe</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              placeholder="Mot de passe actuel"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
              placeholder="Nouveau mot de passe (min. 6 caractères)"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
              placeholder="Confirmer le nouveau mot de passe"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.changePasswordButton, { backgroundColor: theme.primary }, changingPassword && styles.changePasswordButtonDisabled]}
            onPress={handleChangePassword}
            disabled={changingPassword}
          >
            <Text style={[styles.changePasswordButtonText, { color: (theme.background.white || '#fff') }]}>
              {changingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Paramètres personnels */}
        <View style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Paramètres</Text>
          
          <View style={styles.settingsRow}>
            <Text style={[styles.settingsLabel, { color: theme.text.primary }]}>Thème</Text>
            <View style={styles.themeContainer}>
              <TouchableOpacity
                style={[styles.themeButton, { backgroundColor: theme.background.lighter, borderColor: '#ddd' }, settings.theme === 'light' && [styles.themeButtonActive, { backgroundColor: theme.primary, borderColor: theme.primary }]]}
                onPress={() => saveSettings({ theme: 'light' })}
              >
                <Text style={[styles.themeButtonText, { color: (theme.text.secondary || '#666') }, settings.theme === 'light' && { color: (theme.background.white || '#fff') }]}>
                  Clair
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeButton, { backgroundColor: theme.background.lighter, borderColor: '#ddd' }, settings.theme === 'dark' && [styles.themeButtonActive, { backgroundColor: theme.primary, borderColor: theme.primary }]]}
                onPress={() => saveSettings({ theme: 'dark' })}
              >
                <Text style={[styles.themeButtonText, { color: (theme.text.secondary || '#666') }, settings.theme === 'dark' && { color: (theme.background.white || '#fff') }]}>
                  Sombre
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsRow}>
            <Text style={[styles.settingsLabel, { color: theme.text.primary }]}>Notifications</Text>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => saveSettings({ notifications: value })}
            />
          </View>
        </View>

        {/* Informations supplémentaires */}
        <View style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Informations</Text>
          <Text style={[styles.infoText, { color: (theme.text.secondary || '#666') }]}>ID: {currentUser?.id || 'N/A'}</Text>
          <Text style={[styles.infoText, { color: (theme.text.secondary || '#666') }]}>Rôle: {currentUser?.role || 'superadmin'}</Text>
          <Text style={[styles.infoText, { color: (theme.text.secondary || '#666') }]}>
            Membre depuis: {currentUser?.createdAt 
              ? new Date(currentUser.createdAt).toLocaleDateString('fr-FR')
              : 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  changePasswordButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  changePasswordButtonDisabled: {
    opacity: 0.7,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  themeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  themeButtonActive: {
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeButtonTextActive: {
  },
});

export default AdminProfileScreen;

