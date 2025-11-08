import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';
import api from '../config/api';
import { getThemeColors } from '../config/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useRestaurant } from '../contexts/RestaurantContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const { count } = useCart();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [avatarUri, setAvatarUri] = useState(null);
  const [backgroundUri, setBackgroundUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressesList, setShowAddressesList] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    isDefault: false,
  });

  useEffect(() => {
    // Charger les images depuis le user
    // Les images peuvent être en base64 (data:image/...) ou des URLs
    if (user?.avatar) {
      setAvatarUri(user.avatar);
    } else {
      setAvatarUri(null);
    }
    
    if (user?.backgroundImage) {
      setBackgroundUri(user.backgroundImage);
    } else {
      setBackgroundUri(null);
    }
    
    // Initialiser le formulaire avec les données utilisateur
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }

  }, [user]);

  const loadAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return; // Ne pas charger si pas d'utilisateur
    }
    try {
      setLoadingAddresses(true);
      const res = await api.get('/users/addresses');
      if (res.data?.success) {
        setAddresses(res.data.data || []);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      // En cas d'erreur, initialiser avec un tableau vide
      // Les erreurs courantes: 401 (non autorisé), 404 (pas trouvé), 500 (erreur serveur)
      if (error.response?.status && error.response.status >= 500) {
        console.error('Erreur serveur lors du chargement des adresses:', error.response?.data || error.message);
      }
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, [user]);

  useEffect(() => {
    // Charger les adresses seulement si l'utilisateur est authentifié
    if (user) {
      loadAddresses();
    }
  }, [user, loadAddresses]);

  const handleOpenAddressModal = (address = null) => {
    if (address) {
      // Mode édition
      setEditingAddress(address);
      setAddressForm({
        label: address.label || '',
        street: address.street || '',
        city: address.city || '',
        postalCode: address.postalCode || '',
        latitude: address.latitude ? String(address.latitude) : '',
        longitude: address.longitude ? String(address.longitude) : '',
        isDefault: address.isDefault || false,
      });
    } else {
      // Mode création
      setEditingAddress(null);
      setAddressForm({
        label: '',
        street: '',
        city: '',
        postalCode: '',
        latitude: '',
        longitude: '',
        isDefault: false,
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    try {
      // Validation
      if (!addressForm.street.trim()) {
        Alert.alert('Erreur', 'La rue est requise');
        return;
      }
      if (!addressForm.city.trim()) {
        Alert.alert('Erreur', 'La ville est requise');
        return;
      }
      if (!addressForm.postalCode.trim()) {
        Alert.alert('Erreur', 'Le code postal est requis');
        return;
      }

      if (editingAddress) {
        // Mise à jour
        const res = await api.put(`/users/addresses/${editingAddress.id}`, addressForm);
        if (res.data?.success) {
          Alert.alert('Succès', 'Adresse mise à jour avec succès');
          await loadAddresses();
          setShowAddressModal(false);
          // Afficher la liste après mise à jour
          setShowAddressesList(true);
        }
      } else {
        // Création
        const res = await api.post('/users/addresses', addressForm);
        if (res.data?.success) {
          Alert.alert('Succès', 'Adresse ajoutée avec succès');
          await loadAddresses();
          setShowAddressModal(false);
          // Afficher la liste après création
          setShowAddressesList(true);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde adresse:', error);
      const errorMessage = error.response?.data?.message || 'Impossible de sauvegarder l\'adresse';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    Alert.alert(
      'Supprimer l\'adresse',
      'Êtes-vous sûr de vouloir supprimer cette adresse ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/users/addresses/${addressId}`);
              if (res.data?.success) {
                Alert.alert('Succès', 'Adresse supprimée avec succès');
                await loadAddresses();
                // Si plus d'adresses, fermer la liste
                const updatedAddresses = await api.get('/users/addresses').then(r => r.data?.data || []);
                if (updatedAddresses.length === 0) {
                  setShowAddressesList(false);
                }
              }
            } catch (error) {
              console.error('Erreur suppression adresse:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'adresse');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (addressId) => {
    try {
      const res = await api.patch(`/users/addresses/${addressId}/default`);
      if (res.data?.success) {
        await loadAddresses();
      }
    } catch (error) {
      console.error('Erreur définition adresse par défaut:', error);
      Alert.alert('Erreur', 'Impossible de définir l\'adresse par défaut');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: logout, style: 'destructive' },
      ]
    );
  };

  // Obtenir les initiales du nom
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  const pickImage = async (type) => {
    try {
      // Demander permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie pour changer votre photo.');
        return;
      }

      // Lancer le sélecteur d'image
      // Réduire la qualité et la taille pour éviter les erreurs "entity too large"
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permettre l'édition pour toutes les images
        aspect: type === 'avatar' ? [1, 1] : [16, 9], // Aspect ratio pour avatar (carré) et background (large)
        quality: type === 'avatar' ? 0.4 : 0.5, // Qualité réduite pour éviter les erreurs "entity too large"
        allowsMultipleSelection: false,
        // Limiter la résolution maximale
        exif: false, // Ne pas inclure les métadonnées EXIF (réduit la taille)
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        if (type === 'avatar') {
          setAvatarUri(imageUri);
          await uploadImage(imageUri, 'avatar');
        } else if (type === 'background') {
          setBackgroundUri(imageUri);
          await uploadImage(imageUri, 'backgroundImage');
        }
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadImage = async (imageUri, fieldName) => {
    try {
      setUploading(true);
      
      // Convertir l'image en base64 pour la sauvegarder dans la BD
      // Dans React Native, on utilise fetch + blob + base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convertir blob en base64
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Vérifier la taille (ne pas envoyer si > 3MB en base64 pour éviter les erreurs)
      // Un base64 est environ 33% plus gros que l'original
      const maxSize = fieldName === 'avatar' ? 2000000 : 3000000; // 2MB pour avatar, 3MB pour background
      if (base64data.length > maxSize) {
        Alert.alert(
          'Erreur', 
          `L'image est trop volumineuse (${Math.round(base64data.length / 1024 / 1024 * 10) / 10}MB). Veuillez choisir une image plus petite.`
        );
        setUploading(false);
        // Revert local state
        if (fieldName === 'avatar') {
          setAvatarUri(user?.avatar || null);
        } else {
          setBackgroundUri(user?.backgroundImage || null);
        }
        return;
      }
      
      // Mettre à jour le profil avec l'image en base64
      const updateData = { [fieldName]: base64data };
      const res = await api.put('/users/profile', updateData);
      
      if (res.data?.success) {
        // Mettre à jour le contexte utilisateur
        if (updateUser && res.data?.data) {
          updateUser(res.data.data);
        }
        Alert.alert('Succès', 'Photo mise à jour avec succès');
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
      // Revert local state on error
      if (fieldName === 'avatar') {
        setAvatarUri(user?.avatar || null);
      } else {
        setBackgroundUri(user?.backgroundImage || null);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setEditingProfile(true);
      
      // Validation
      if (!formData.name.trim()) {
        Alert.alert('Erreur', 'Le nom est requis');
        setEditingProfile(false);
        return;
      }
      
      if (!formData.email.trim()) {
        Alert.alert('Erreur', 'L\'email est requis');
        setEditingProfile(false);
        return;
      }
      
      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Erreur', 'Veuillez entrer un email valide');
        setEditingProfile(false);
        return;
      }
      
      if (!formData.phone.trim()) {
        Alert.alert('Erreur', 'Le téléphone est requis');
        setEditingProfile(false);
        return;
      }
      
      // Validation mot de passe si fourni
      if (formData.newPassword || formData.confirmPassword) {
        if (!formData.currentPassword) {
          Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel pour changer le mot de passe');
          setEditingProfile(false);
          return;
        }
        
        if (formData.newPassword.length < 6) {
          Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
          setEditingProfile(false);
          return;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
          setEditingProfile(false);
          return;
        }
      }
      
      // Préparer les données à envoyer
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };
      
      // Ajouter le mot de passe seulement si fourni
      if (formData.newPassword && formData.currentPassword) {
        updateData.password = formData.newPassword;
        updateData.currentPassword = formData.currentPassword;
      }
      
      // Appel API
      const res = await api.put('/users/profile', updateData);
      
      if (res.data?.success) {
        // Mettre à jour le contexte utilisateur
        if (updateUser && res.data?.data) {
          updateUser(res.data.data);
        }
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setShowEditModal(false);
        // Réinitialiser les mots de passe
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        throw new Error(res.data?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Impossible de mettre à jour le profil';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setEditingProfile(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Header
        onCart={() => {
          // Naviguer vers Home (TabNavigator) puis Cart (HomeStack)
          const tabNavigator = navigation.getParent();
          if (tabNavigator) {
            tabNavigator.navigate('Home', { screen: 'Cart' });
          } else {
            navigation.navigate('Cart');
          }
        }}
        cartCount={count}
        notifications={notifications}
        notificationCount={notificationCount}
        onDeleteNotification={(notificationId) => {
          if (clearNotification) {
            clearNotification(notificationId);
          }
        }}
        onNotificationPress={(notif) => {
          // Marquer la notification comme lue
          if (notif.id && markAsRead) {
            markAsRead(notif.id);
          }
          if (notif.orderId) {
            // Naviguer vers la page de commandes avec l'orderId en paramètre
            const tabNavigator = navigation.getParent();
            if (tabNavigator) {
              tabNavigator.navigate('Orders', { orderId: notif.orderId });
            }
          } else {
            const tabNavigator = navigation.getParent();
            if (tabNavigator) {
              tabNavigator.navigate('Orders');
            }
          }
        }}
        onNotifications={() => {
          const tabNavigator = navigation.getParent();
          if (tabNavigator) {
            tabNavigator.navigate('Orders');
          }
        }}
        onProfile={() => {}}
        onLogout={logout}
        showCart={true}
      />

      <ScrollView style={[styles.container, { backgroundColor: theme.background.light }]} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: (theme.background.white || '#fff'), borderBottomColor: theme.background.border }]}>
          {/* Photo de fond avec overlay */}
          <View style={styles.backgroundContainer}>
            {backgroundUri ? (
              <Image source={{ uri: backgroundUri }} style={styles.backgroundImage} resizeMode="cover" />
            ) : (
              <View style={[styles.backgroundPlaceholder, { backgroundColor: theme.primary }]} />
            )}
            {/* Overlay pour améliorer la lisibilité */}
            <View style={styles.backgroundOverlay} />
            
            <TouchableOpacity 
              style={styles.editBackgroundButton}
              onPress={() => pickImage('background')}
              disabled={uploading}
            >
              <MaterialIcons name="camera-alt" size={20} color={(theme.background.white || '#fff')} />
              <Text style={[styles.editButtonText, { color: (theme.background.white || '#fff') }]}>Changer</Text>
            </TouchableOpacity>

            {/* Contenu au-dessus de la photo de fond */}
            <View style={styles.profileContent}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: theme.primary, borderColor: (theme.background.white || '#fff') }]}>
                    <Text style={[styles.avatarText, { color: (theme.background.white || '#fff') }]}>
                      {getInitials(user?.name).toUpperCase()}
                    </Text>
                  </View>
                )}
                  <TouchableOpacity
                  style={[styles.editAvatarButton, { backgroundColor: theme.primary, borderColor: (theme.background.white || '#fff') }]}
                  onPress={() => pickImage('avatar')}
                  disabled={uploading}
                >
                  <MaterialIcons name="camera-alt" size={16} color={(theme.background.white || '#fff')} />
                </TouchableOpacity>
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={(theme.background.white || '#fff')} />
                  </View>
                )}
              </View>

              {/* Nom et email sur la photo de fond */}
              <Text style={[styles.userName, { color: (theme.background.white || '#fff') }]}>{user?.name || 'Utilisateur'}</Text>
              <Text style={[styles.userEmail, { color: (theme.background.white || '#fff') }]}>{user?.email || ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: (theme.background.white || '#fff') }]}
            onPress={() => setShowEditModal(true)}
          >
            <Text style={[styles.menuItemText, { color: theme.text.primary }]}>📝 Modifier le profil</Text>
            <Text style={[styles.menuItemArrow, { color: theme.text.tertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              if (addresses.length === 0) {
                // Si aucune adresse, ouvrir le modal d'ajout
                handleOpenAddressModal();
              } else {
                // Si des adresses existent, afficher/cacher la liste
                setShowAddressesList(!showAddressesList);
              }
            }}
          >
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemText, { color: theme.text.primary }]}>📍 Mes adresses</Text>
              {addresses.length > 0 && (
                <Text style={[styles.menuItemBadge, { backgroundColor: theme.primary, color: (theme.background.white || '#fff') }]}>{addresses.length}</Text>
              )}
            </View>
            <Text style={[styles.menuItemArrow, { color: theme.text.tertiary }]}>{showAddressesList ? '⌄' : '›'}</Text>
          </TouchableOpacity>

          {/* Liste des adresses */}
          {addresses.length > 0 && showAddressesList && (
            <View style={[styles.addressesListContainer, { backgroundColor: (theme.background.white || '#fff') }]}>
              <View style={[styles.addressesListHeader, { borderBottomColor: theme.background.border }]}>
                <Text style={[styles.addressesListTitle, { color: theme.text.primary }]}>Vos adresses</Text>
                <TouchableOpacity
                  style={styles.addAddressSmallButton}
                  onPress={() => handleOpenAddressModal()}
                >
                  <MaterialIcons name="add" size={18} color={theme.primary} />
                  <Text style={[styles.addAddressSmallText, { color: theme.primary }]}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {loadingAddresses ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
              ) : (
                addresses.map((address) => (
                  <View key={address.id} style={styles.addressCard}>
                    <View style={styles.addressInfo}>
                      <View style={styles.addressHeader}>
                        {address.isDefault && (
                          <View style={[styles.defaultBadge, { backgroundColor: theme.primary }]}>
                            <Text style={[styles.defaultBadgeText, { color: (theme.background.white || '#fff') }]}>Par défaut</Text>
                          </View>
                        )}
                        {address.label && (
                          <Text style={[styles.addressLabel, { color: theme.text.primary }]}>{address.label}</Text>
                        )}
                      </View>
                      <Text style={[styles.addressStreet, { color: (theme.text.secondary || '#666') }]}>{address.street}</Text>
                      <Text style={[styles.addressCity, { color: (theme.text.secondary || '#666') }]}>
                        {address.city}{address.postalCode ? `, ${address.postalCode}` : ''}
                      </Text>
                    </View>
                    <View style={styles.addressActions}>
                      {!address.isDefault && (
                        <TouchableOpacity
                          style={styles.addressActionButton}
                          onPress={() => handleSetDefault(address.id)}
                        >
                          <MaterialIcons name="star-border" size={20} color={(theme.text.secondary || '#666')} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.addressActionButton}
                        onPress={() => handleOpenAddressModal(address)}
                      >
                        <MaterialIcons name="edit" size={20} color={(theme.text.secondary || '#666')} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.addressActionButton}
                        onPress={() => handleDeleteAddress(address.id)}
                      >
                        <MaterialIcons name="delete" size={20} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: (theme.background.white || '#fff') }]}>
            <Text style={[styles.menuItemText, { color: theme.text.primary }]}>💳 Moyens de paiement</Text>
            <Text style={[styles.menuItemArrow, { color: theme.text.tertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: (theme.background.white || '#fff') }]}>
            <Text style={[styles.menuItemText, { color: theme.text.primary }]}>⭐ Restaurants favoris</Text>
            <Text style={[styles.menuItemArrow, { color: theme.text.tertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: (theme.background.white || '#fff') }]}>
            <Text style={[styles.menuItemText, { color: theme.text.primary }]}>⚙️ Paramètres</Text>
            <Text style={[styles.menuItemArrow, { color: theme.text.tertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: (theme.background.white || '#fff') }]}>
            <Text style={[styles.menuItemText, { color: theme.text.primary }]}>ℹ️ Aide & Support</Text>
            <Text style={[styles.menuItemArrow, { color: theme.text.tertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <Text style={[styles.menuItemText, styles.logoutText]}>
              🚪 Déconnexion
            </Text>
          </TouchableOpacity>
        </View>

        <Footer onContact={() => navigation.getParent()?.navigate('Contact')} />
      </ScrollView>

      {/* Modal de modification du profil */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: (theme.background.white || '#fff') }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.background.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Modifier le profil</Text>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text.primary }]}>Nom complet</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Votre nom"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  placeholder="votre.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  placeholder="Votre numéro de téléphone"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.background.border }]} />

              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Changer le mot de passe (optionnel)</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mot de passe actuel</Text>
                <TextInput
                  style={styles.input}
                  value={formData.currentPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Entrez votre mot de passe actuel"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={formData.newPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Au moins 6 caractères"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirmez le nouveau mot de passe"
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.background.border }]}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.background.light }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: (theme.text.secondary || '#666') }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveProfile}
                disabled={editingProfile}
              >
                {editingProfile ? (
                  <ActivityIndicator size="small" color={(theme.background.white || '#fff')} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: (theme.background.white || '#fff') }]}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de gestion des adresses */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: (theme.background.white || '#fff') }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.background.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                {editingAddress ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowAddressModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Libellé (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  value={addressForm.label}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, label: text }))}
                  placeholder="Ex: Domicile, Bureau, etc."
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Rue *</Text>
                <TextInput
                  style={styles.input}
                  value={addressForm.street}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, street: text }))}
                  placeholder="Numéro et nom de la rue"
                  multiline
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ville *</Text>
                <TextInput
                  style={styles.input}
                  value={addressForm.city}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, city: text }))}
                  placeholder="Ville"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Code postal *</Text>
                <TextInput
                  style={styles.input}
                  value={addressForm.postalCode}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, postalCode: text }))}
                  placeholder="Code postal"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAddressForm(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                >
                  <MaterialIcons 
                    name={addressForm.isDefault ? 'check-box' : 'check-box-outline-blank'} 
                    size={24} 
                    color={addressForm.isDefault ? theme.primary : theme.text.tertiary} 
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.text.primary }]}>Définir comme adresse par défaut</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.background.border }]}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.background.light }]}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: (theme.text.secondary || '#666') }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveAddress}
              >
                <Text style={[styles.saveButtonText, { color: (theme.background.white || '#fff') }]}>
                  {editingAddress ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 0,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  backgroundContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backgroundPlaceholder: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  editBackgroundButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 10,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  userEmail: {
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuItemBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuItemArrow: {
    fontSize: 24,
  },
  logoutItem: {
    marginTop: 20,
  },
  logoutText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Addresses styles
  addressesListContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  addressesListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  addressesListTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addAddressSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    gap: 5,
  },
  addAddressSmallText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginRight: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressStreet: {
    fontSize: 14,
    marginBottom: 3,
  },
  addressCity: {
    fontSize: 14,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 10,
  },
  addressActionButton: {
    padding: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default ProfileScreen;
