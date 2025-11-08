import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getThemeColors } from '../../config/theme';
import { adminService } from '../../services/adminService';
import restaurantService from '../../services/restaurantService';
import api from '../../config/api';

const AdminMenuScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menu, setMenu] = useState([]);
  const [editor, setEditor] = useState({}); // { [id]: { name, price, imageUrl } }
  const [savingId, setSavingId] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', priceStr: '', category: 'Plats', description: 'Description à compléter', imageUrl: '', selectedImage: null });

  const loadMenu = async () => {
    try {
      const [menuRes, infoRes] = await Promise.all([
        restaurantService.getMenuItems(),
        restaurantService.getRestaurantInfo(),
      ]);
      // restaurantService.getMenuItems retourne { success, data }
      // restaurantService.getRestaurantInfo retourne directement les données
      const list = menuRes?.success && Array.isArray(menuRes.data) 
        ? menuRes.data 
        : Array.isArray(menuRes) 
          ? menuRes 
          : [];
      setMenu(list);
      // infoRes est directement l'objet restaurant (pas { success, data })
      setRestaurantId(infoRes?.id || null);
      // Pré-remplir l'éditeur avec nom, prix et image
      // Les accompagnements et boissons sont gérés globalement dans Accompagnements
      const next = {};
      list.forEach((it) => {
        const images = Array.isArray(it.images) ? it.images : [];
        next[it.id] = {
          name: it.name || '',
          price: String(it.price || '0'),
          imageUrl: images.length > 0 ? images[0] : '',
          selectedImage: null,
        };
      });
      setEditor(next);
    } catch (e) {
      console.error('loadMenu error', e);
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      await loadMenu();
    } catch (err) {
      console.error('fetchAll error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onChangeEditor = (id, key, value) => {
    setEditor((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }));
  };

  // Sélectionner une image depuis la galerie
  const pickImage = async (menuItemId = null) => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
        return;
      }

      // Ouvrir le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        if (menuItemId) {
          // Pour l'édition d'un menu existant
          onChangeEditor(menuItemId, 'selectedImage', imageUri);
          onChangeEditor(menuItemId, 'imageUrl', imageUri);
        } else {
          // Pour la création d'un nouveau menu
          setNewItem(prev => ({ ...prev, selectedImage: imageUri, imageUrl: imageUri }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Entrer une URL d'image manuellement
  const handleImageUrlChange = (menuItemId, url) => {
    if (menuItemId) {
      onChangeEditor(menuItemId, 'imageUrl', url);
      onChangeEditor(menuItemId, 'selectedImage', null); // Reset selected image
    } else {
      setNewItem(prev => ({ ...prev, imageUrl: url, selectedImage: null }));
    }
  };

  const saveMenuItem = async (it) => {
    try {
      const state = editor[it.id] || {};
      const name = (state.name || '').trim();
      const priceStr = (state.price || '0').replace(',', '.');
      const price = parseFloat(priceStr);
      
      if (!name) {
        Alert.alert('Validation', 'Le nom du menu est requis.');
        return;
      }
      if (Number.isNaN(price) || price < 0) {
        Alert.alert('Validation', 'Le prix doit être un nombre valide et positif.');
        return;
      }
      
      // Ne plus gérer les options ici - elles sont gérées globalement
      // Le backend utilisera automatiquement les valeurs globales depuis SiteInfo
      
      setSavingId(it.id);
      
      // Préparer les images
      const imageUrl = (state.imageUrl || '').trim();
      const images = imageUrl ? [imageUrl] : [];
      
      const payload = {
        name,
        price,
        images,
        // Les options seront automatiquement enrichies par le backend avec les valeurs globales
      };
      
      await adminService.updateMenuItem(it.id, payload);
      Alert.alert('Succès', 'Menu mis à jour');
      await loadMenu();
    } catch (e) {
      console.error('saveMenuItem error', e);
      Alert.alert('Erreur', e?.message || 'Échec de la sauvegarde');
    } finally {
      setSavingId(null);
    }
  };

  const addMenuItem = async () => {
    try {
      if (!restaurantId) {
        Alert.alert('Erreur', "Restaurant introuvable pour l'ajout");
        return;
      }
      const name = (newItem.name || '').trim();
      const price = parseFloat(String(newItem.priceStr || '').replace(',', '.'));
      const category = (newItem.category || 'Plats').trim();
      const description = (newItem.description || 'Description à compléter').trim();
      const imageUrl = (newItem.imageUrl || '').trim();
      if (!name) return Alert.alert('Validation', 'Nom requis');
      if (Number.isNaN(price)) return Alert.alert('Validation', 'Prix invalide');
      
      // Préparer les images (priorité à selectedImage si disponible, sinon imageUrl)
      const images = [];
      if (newItem.selectedImage) {
        images.push(newItem.selectedImage);
      } else if (imageUrl) {
        images.push(imageUrl);
      }
      
      const payload = {
        name,
        price,
        category,
        description,
        restaurantId,
        images,
        isAvailable: true,
      };
      await adminService.createMenuItem(payload);
      setNewItem({ name: '', priceStr: '', category: 'Plats', description: 'Description à compléter', imageUrl: '', selectedImage: null });
      Alert.alert('Succès', 'Plat ajouté');
      await loadMenu();
    } catch (e) {
      console.error('addMenuItem error', e);
      Alert.alert('Erreur', `Échec de l'ajout`);
    }
  };

  const deleteMenu = async (it) => {
    try {
      Alert.alert('Confirmation', `Supprimer "${it.name}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          await adminService.deleteMenuItem(it.id);
          await loadMenu();
        } },
      ]);
    } catch (e) {
      console.error('deleteMenu error', e);
      Alert.alert('Erreur', 'Échec de la suppression');
    }
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
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}
      >
        <Text style={[styles.title, { color: theme.text.primary }]}>Gestion des Menus</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <Text style={[styles.loadingText, { color: (theme.text.secondary || '#666') }]}>Chargement...</Text>
          </View>
        ) : (
          <>
            {/* Formulaire ajout */}
            <View style={[styles.menuCard, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
              <Text style={[styles.menuName, { color: theme.text.primary }]}>Ajouter un menu</Text>
              <View style={styles.menuRow}>
                <View style={styles.menuCol}>
                  <Text style={styles.menuLabel}>Nom</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]} value={newItem.name} onChangeText={(t) => setNewItem((p) => ({ ...p, name: t }))} placeholder="Nom du plat" />
                </View>
                <View style={styles.menuCol}>
                  <Text style={styles.menuLabel}>Prix (€)</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]} value={newItem.priceStr} onChangeText={(t) => setNewItem((p) => ({ ...p, priceStr: t }))} placeholder="0.00" keyboardType="decimal-pad" />
                </View>
              </View>
              <View style={styles.menuRow}>
                <View style={styles.menuCol}>
                  <Text style={styles.menuLabel}>Catégorie</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]} value={newItem.category} onChangeText={(t) => setNewItem((p) => ({ ...p, category: t }))} placeholder="Plats" />
                </View>
                <View style={styles.menuCol}>
                  <Text style={styles.menuLabel}>Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]} value={newItem.description} onChangeText={(t) => setNewItem((p) => ({ ...p, description: t }))} placeholder="Description" />
                </View>
              </View>
              
              {/* Section Image */}
              <View style={styles.imageSection}>
                <Text style={styles.menuLabel}>Image du plat</Text>
                {(newItem.selectedImage || newItem.imageUrl) ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: newItem.selectedImage || newItem.imageUrl }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.removeImageBtn}
                      onPress={() => setNewItem(prev => ({ ...prev, selectedImage: null, imageUrl: '' }))}
                    >
                      <MaterialIcons name="close" size={20} color={(theme.background.white || '#fff')} />
                    </TouchableOpacity>
                  </View>
                ) : null}
                <View style={styles.imageButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.imageBtn, styles.imageBtnPrimary]}
                    onPress={() => pickImage(null)}
                  >
                    <MaterialIcons name="photo-library" size={18} color={(theme.background.white || '#fff')} />
                    <Text style={[styles.imageBtnText, { color: (theme.background.white || '#fff') }]}>Galerie</Text>
                  </TouchableOpacity>
                  <Text style={[styles.imageOrText, { color: theme.text.tertiary }]}>ou</Text>
                  <TextInput
                    style={[styles.input, styles.imageUrlInput, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
                    value={newItem.imageUrl}
                    onChangeText={(url) => handleImageUrlChange(null, url)}
                    placeholder="URL de l'image"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={addMenuItem}>
                <Text style={[styles.saveBtnText, { color: (theme.background.white || '#fff') }]}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {/* Liste / édition menu (nom et prix uniquement) */}
            {/* Les accompagnements et boissons sont gérés globalement dans Accompagnements */}
            <Text style={[styles.helperText, { color: theme.text.tertiary }]}>(Accompagnements et boissons gérés globalement dans Accompagnements)</Text>
            {menu.map((it) => {
              const images = Array.isArray(it.images) ? it.images : [];
              const currentImageUrl = images.length > 0 ? images[0] : '';
              const e = editor[it.id] || { 
                name: it.name || '', 
                price: String(it.price || '0'),
                imageUrl: currentImageUrl,
                selectedImage: null,
              };
              const displayImage = e.selectedImage || e.imageUrl || currentImageUrl;
              
              return (
                <View key={it.id} style={[styles.menuCard, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
                  <Text style={[styles.menuName, { color: theme.text.primary }]}>{it.name}</Text>
                  
                  <View style={styles.menuRow}>
                    <View style={styles.menuCol}>
                      <Text style={styles.menuLabel}>Nom</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]} 
                        value={e.name} 
                        onChangeText={(t) => onChangeEditor(it.id, 'name', t)} 
                        placeholder="Nom du plat" 
                      />
                    </View>
                    <View style={styles.menuCol}>
                      <Text style={styles.menuLabel}>Prix (€)</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]} 
                        value={e.price} 
                        onChangeText={(t) => onChangeEditor(it.id, 'price', t)} 
                        placeholder="0.00" 
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  
                  {/* Section Image pour l'édition */}
                  <View style={styles.imageSection}>
                    <Text style={styles.menuLabel}>Image du plat</Text>
                    {displayImage ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image 
                          source={{ uri: displayImage }} 
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                        <TouchableOpacity 
                          style={styles.removeImageBtn}
                          onPress={() => {
                            onChangeEditor(it.id, 'selectedImage', null);
                            onChangeEditor(it.id, 'imageUrl', '');
                          }}
                        >
                          <MaterialIcons name="close" size={20} color={(theme.background.white || '#fff')} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    <View style={styles.imageButtonsRow}>
                      <TouchableOpacity 
                        style={[styles.imageBtn, styles.imageBtnPrimary]}
                        onPress={() => pickImage(it.id)}
                      >
                        <MaterialIcons name="photo-library" size={18} color={(theme.background.white || '#fff')} />
                        <Text style={[styles.imageBtnText, { color: (theme.background.white || '#fff') }]}>Galerie</Text>
                      </TouchableOpacity>
                      <Text style={[styles.imageOrText, { color: theme.text.tertiary }]}>ou</Text>
                      <TextInput
                        style={[styles.input, styles.imageUrlInput, { backgroundColor: theme.background.lighter, borderColor: theme.background.border, color: theme.text.primary }]}
                        value={e.imageUrl || ''}
                        onChangeText={(url) => handleImageUrlChange(it.id, url)}
                        placeholder="URL de l'image"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  
                  <View style={[styles.menuRow, { marginTop: 10 }]}>
                    <TouchableOpacity 
                      style={[styles.saveBtn, { flex: 1, marginRight: 6, backgroundColor: theme.primary }, savingId === it.id && { opacity: 0.7 }]} 
                      onPress={() => saveMenuItem(it)} 
                      disabled={savingId === it.id}
                    >
                      <Text style={[styles.saveBtnText, { color: (theme.background.white || '#fff') }]}>{savingId === it.id ? 'Sauvegarde…' : 'Sauvegarder'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteBtn, { flex: 1, marginLeft: 6, backgroundColor: theme.error }]} 
                      onPress={() => deleteMenu(it)}
                    >
                      <Text style={[styles.deleteBtnText, { color: (theme.background.white || '#fff') }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  loadingBox: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 8 },
  menuCard: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 10 },
  menuName: { fontWeight: '800', marginBottom: 8 },
  menuRow: { flexDirection: 'row', gap: 10 },
  menuCol: { flex: 1 },
  menuLabel: { color: '#555', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  saveBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { fontWeight: '800' },
  deleteBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  deleteBtnText: { fontWeight: '800' },
  helperText: { fontSize: 11, marginTop: 4, marginBottom: 8, fontStyle: 'italic' },
  imageSection: { marginTop: 12 },
  imagePreviewContainer: { position: 'relative', marginBottom: 10, borderRadius: 8, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 150, backgroundColor: '#e0e0e0' },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  imageButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  imageBtnPrimary: { backgroundColor: '#2196F3' },
  imageBtnText: { fontWeight: '600', fontSize: 14 },
  imageOrText: { fontSize: 12 },
  imageUrlInput: { flex: 1, marginTop: 0 },
});

export default AdminMenuScreen;

