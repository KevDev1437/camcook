import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getThemeColors } from '../../config/theme';

const AdminAccompanimentsScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  
  // Liste des accompagnements et boissons (format: { id, name, price })
  const [accompaniments, setAccompaniments] = useState([]);
  const [drinks, setDrinks] = useState([]);
  
  // Éditeur pour chaque élément
  const [accompEditor, setAccompEditor] = useState({}); // { id: { name, price } }
  const [drinkEditor, setDrinkEditor] = useState({}); // { id: { name, price } }
  
  // Nouveaux éléments à ajouter
  const [newAccomp, setNewAccomp] = useState({ name: '', price: '' });
  const [newDrink, setNewDrink] = useState({ name: '', price: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  // Normaliser les données (supporte ancien format string et nouveau format objet)
  const normalizeItem = (item) => {
    if (typeof item === 'string') {
      return { name: item, price: 0 };
    }
    if (typeof item === 'object' && item !== null) {
      return {
        name: item.name || String(item),
        price: typeof item.price === 'number' ? item.price : 0
      };
    }
    return { name: String(item), price: 0 };
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Charger les accompagnements depuis /api/accompaniments
      const accRes = await api.get('/accompaniments').catch(() => ({ data: { data: [] } }));
      const accList = Array.isArray(accRes?.data?.data) ? accRes.data.data : [];
      
      // Charger les boissons depuis /api/drinks
      const drinkRes = await api.get('/drinks').catch(() => ({ data: { data: [] } }));
      const drinkList = Array.isArray(drinkRes?.data?.data) ? drinkRes.data.data : [];
      
      setAccompaniments(accList);
      setDrinks(drinkList);
      
      // Initialiser l'éditeur avec les valeurs actuelles (utiliser id comme clé)
      const accEdit = {};
      accList.forEach((acc) => {
        accEdit[acc.id] = {
          name: acc.name || '',
          price: String(acc.price || 0),
        };
      });
      setAccompEditor(accEdit);
      
      const drinkEdit = {};
      drinkList.forEach((drink) => {
        drinkEdit[drink.id] = {
          name: drink.name || '',
          price: String(drink.price || 0),
        };
      });
      setDrinkEditor(drinkEdit);
    } catch (e) {
      console.log('Error loading accompaniments and drinks', e);
      Alert.alert('Erreur', 'Impossible de charger les accompagnements et boissons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const saveAccomp = async (id) => {
    try {
      const edited = accompEditor[id] || {};
      const name = (edited.name || '').trim();
      const priceStr = (edited.price || '0').replace(',', '.');
      const price = parseFloat(priceStr);

      if (!name) {
        Alert.alert('Validation', 'Le nom de l\'accompagnement est requis');
        return;
      }
      if (Number.isNaN(price) || price < 0) {
        Alert.alert('Validation', 'Le prix doit être un nombre valide et positif');
        return;
      }

      setSavingId(`accomp-${id}`);
      
      // Mettre à jour via API
      const res = await api.put(`/accompaniments/${id}`, { name, price });
      if (!res?.data?.success) throw new Error('Erreur de sauvegarde');
      
      Alert.alert('Succès', 'Accompagnement sauvegardé');
      await loadSettings();
    } catch (e) {
      console.error('Error saving accompaniment', e);
      Alert.alert('Erreur', 'Échec de la sauvegarde');
    } finally {
      setSavingId(null);
    }
  };

  const saveDrink = async (index) => {
    try {
      const edited = drinkEditor[index] || {};
      const name = (edited.name || '').trim();
      const priceStr = (edited.price || '0').replace(',', '.');
      const price = parseFloat(priceStr);

      if (!name) {
        Alert.alert('Validation', 'Le nom de la boisson est requis');
        return;
      }
      if (Number.isNaN(price) || price < 0) {
        Alert.alert('Validation', 'Le prix doit être un nombre valide et positif');
        return;
      }

      setSavingId(`drink-${index}`);
      const newList = [...drinks];
      newList[index] = { name, price };
      setDrinks(newList);

      const settings = {
        accompaniments: accompaniments.filter(a => a.name && a.name.trim().length > 0),
        drinks: drinks.map((drink, idx) => 
          idx === index ? { name, price } : drink
        ).filter(d => d.name && d.name.trim().length > 0),
      };

      const res = await api.put('/site-info', { settings });
      if (!res?.data?.success) throw new Error('Erreur de sauvegarde');
      
      Alert.alert('Succès', 'Boisson sauvegardée');
      await loadSettings();
    } catch (e) {
      console.error('Error saving drink', e);
      Alert.alert('Erreur', 'Échec de la sauvegarde');
    } finally {
      setSavingId(null);
    }
  };

  const onChangeAccomp = (id, field, value) => {
    setAccompEditor((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));
  };

  const onChangeDrink = (id, field, value) => {
    setDrinkEditor((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));
  };

  const addAccomp = async () => {
    const name = (newAccomp.name || '').trim();
    const priceStr = (newAccomp.price || '0').replace(',', '.');
    const price = parseFloat(priceStr);

    if (!name) {
      Alert.alert('Validation', 'Veuillez entrer un nom d\'accompagnement');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      Alert.alert('Validation', 'Le prix doit être un nombre valide et positif');
      return;
    }

    try {
      setSavingId('add-accomp');
      
      // Créer via API
      const res = await api.post('/accompaniments', { name, price });
      if (!res?.data?.success) throw new Error('Erreur de sauvegarde');
      
      setNewAccomp({ name: '', price: '' });
      
      // Recharger pour s'assurer que tout est synchronisé
      await loadSettings();
      Alert.alert('Succès', 'Accompagnement ajouté et sauvegardé');
    } catch (e) {
      console.error('Error adding accompaniment', e);
      Alert.alert('Erreur', 'Échec de l\'ajout');
      await loadSettings();
    } finally {
      setSavingId(null);
    }
  };

  const addDrink = async () => {
    const name = (newDrink.name || '').trim();
    const priceStr = (newDrink.price || '0').replace(',', '.');
    const price = parseFloat(priceStr);

    if (!name) {
      Alert.alert('Validation', 'Veuillez entrer un nom de boisson');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      Alert.alert('Validation', 'Le prix doit être un nombre valide et positif');
      return;
    }

    try {
      setSavingId('add-drink');
      
      // Créer via API
      const res = await api.post('/drinks', { name, price });
      if (!res?.data?.success) throw new Error('Erreur de sauvegarde');
      
      setNewDrink({ name: '', price: '' });
      
      // Recharger pour s'assurer que tout est synchronisé
      await loadSettings();
      Alert.alert('Succès', 'Boisson ajoutée et sauvegardée');
    } catch (e) {
      console.error('Error adding drink', e);
      Alert.alert('Erreur', 'Échec de l\'ajout');
      // Restaurer l'état en cas d'erreur
      await loadSettings();
    } finally {
      setSavingId(null);
    }
  };

  const deleteAccomp = (id) => {
    const acc = accompaniments.find(a => a.id === id);
    Alert.alert(
      'Confirmation',
      `Supprimer "${acc?.name || 'cet accompagnement'}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/accompaniments/${id}`);
              if (!res?.data?.success) throw new Error('Erreur de suppression');
              
              Alert.alert('Succès', 'Accompagnement supprimé');
              await loadSettings();
            } catch (e) {
              console.error('Error deleting accompaniment', e);
              Alert.alert('Erreur', 'Échec de la suppression');
              await loadSettings();
            }
          },
        },
      ]
    );
  };

  const deleteDrink = (id) => {
    const drink = drinks.find(d => d.id === id);
    Alert.alert(
      'Confirmation',
      `Supprimer "${drink?.name || 'cette boisson'}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/drinks/${id}`);
              if (!res?.data?.success) throw new Error('Erreur de suppression');
              
              Alert.alert('Succès', 'Boisson supprimée');
              await loadSettings();
            } catch (e) {
              console.error('Error deleting drink', e);
              Alert.alert('Erreur', 'Échec de la suppression');
              await loadSettings();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          onNotifications={() => navigation.navigate('AdminOrders')} 
          notificationCount={0} 
          onProfile={() => navigation.navigate('AdminProfile')} 
          onLogout={logout}
          onReviews={() => navigation.navigate('AdminReviews')}
          onContacts={() => navigation.navigate('AdminContacts')}
          showAdminActions={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: (theme.text.secondary || '#666') }]}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSettings} />}
      >
        <Text style={styles.title}>Gestion des Accompagnements et Boissons</Text>
        
        <Text style={styles.description}>
          Les accompagnements et boissons définis ici seront disponibles pour tous les menus.
        </Text>

        {/* Section Accompagnements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Accompagnements</Text>
          
          {/* Formulaire d'ajout */}
          <View style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Ajouter un accompagnement</Text>
            <View style={styles.addRow}>
              <View style={styles.addInputContainer}>
                <Text style={styles.addLabel}>Nom</Text>
                <TextInput
                  style={styles.addInput}
                  value={newAccomp.name}
                  onChangeText={(value) => setNewAccomp({ ...newAccomp, name: value })}
                  placeholder="Nom de l'accompagnement"
                />
              </View>
              <View style={styles.addInputContainer}>
                <Text style={styles.addLabel}>Prix (€)</Text>
                <TextInput
                  style={styles.addInput}
                  value={newAccomp.price}
                  onChangeText={(value) => setNewAccomp({ ...newAccomp, price: value })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.primary }, savingId === 'add-accomp' && styles.addButtonDisabled]} 
                onPress={addAccomp}
                disabled={savingId === 'add-accomp'}
              >
                {savingId === 'add-accomp' ? (
                  <ActivityIndicator color={(theme.background.white || '#fff')} size="small" />
                ) : (
                  <MaterialIcons name="add" size={24} color={(theme.background.white || '#fff')} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Liste des accompagnements */}
          {accompaniments.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>Aucun accompagnement</Text>
          ) : (
            accompaniments.map((acc) => {
              const edited = accompEditor[acc.id] || { name: acc.name || '', price: String(acc.price || 0) };
              const isSaving = savingId === `accomp-${acc.id}`;
              
              return (
                <View key={acc.id} style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
                  <Text style={[styles.cardTitle, { color: theme.text.primary }]}>{acc.name || `Accompagnement ${acc.id}`}</Text>
                  
                  <View style={styles.editRow}>
                    <View style={styles.editCol}>
                      <Text style={styles.editLabel}>Nom</Text>
                      <TextInput
                        style={styles.input}
                        value={edited.name}
                        onChangeText={(value) => onChangeAccomp(acc.id, 'name', value)}
                        placeholder="Nom de l'accompagnement"
                      />
                    </View>
                    <View style={styles.editCol}>
                      <Text style={styles.editLabel}>Prix (€)</Text>
                      <TextInput
                        style={styles.input}
                        value={edited.price}
                        onChangeText={(value) => onChangeAccomp(acc.id, 'price', value)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.saveButton, { backgroundColor: theme.primary }, isSaving && styles.saveButtonDisabled]}
                      onPress={() => saveAccomp(acc.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator color={(theme.background.white || '#fff')} size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="save" size={18} color={(theme.background.white || '#fff')} />
                          <Text style={[styles.saveButtonText, { color: (theme.background.white || '#fff') }]}>Sauvegarder</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: theme.error }]}
                      onPress={() => deleteAccomp(acc.id)}
                    >
                      <MaterialIcons name="delete" size={18} color={(theme.background.white || '#fff')} />
                      <Text style={[styles.deleteButtonText, { color: (theme.background.white || '#fff') }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Section Boissons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Boissons</Text>
          
          {/* Formulaire d'ajout */}
          <View style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Ajouter une boisson</Text>
            <View style={styles.addRow}>
              <View style={styles.addInputContainer}>
                <Text style={styles.addLabel}>Nom</Text>
                <TextInput
                  style={styles.addInput}
                  value={newDrink.name}
                  onChangeText={(value) => setNewDrink({ ...newDrink, name: value })}
                  placeholder="Nom de la boisson"
                />
              </View>
              <View style={styles.addInputContainer}>
                <Text style={styles.addLabel}>Prix (€)</Text>
                <TextInput
                  style={styles.addInput}
                  value={newDrink.price}
                  onChangeText={(value) => setNewDrink({ ...newDrink, price: value })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: theme.primary }, savingId === 'add-drink' && styles.addButtonDisabled]} 
                onPress={addDrink}
                disabled={savingId === 'add-drink'}
              >
                {savingId === 'add-drink' ? (
                  <ActivityIndicator color={(theme.background.white || '#fff')} size="small" />
                ) : (
                  <MaterialIcons name="add" size={24} color={(theme.background.white || '#fff')} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Liste des boissons */}
          {drinks.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>Aucune boisson</Text>
          ) : (
            drinks.map((drink) => {
              const edited = drinkEditor[drink.id] || { name: drink.name || '', price: String(drink.price || 0) };
              const isSaving = savingId === `drink-${drink.id}`;
              
              return (
                <View key={drink.id} style={[styles.card, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
                  <Text style={[styles.cardTitle, { color: theme.text.primary }]}>{drink.name || `Boisson ${drink.id}`}</Text>
                  
                  <View style={styles.editRow}>
                    <View style={styles.editCol}>
                      <Text style={styles.editLabel}>Nom</Text>
                      <TextInput
                        style={styles.input}
                        value={edited.name}
                        onChangeText={(value) => onChangeDrink(drink.id, 'name', value)}
                        placeholder="Nom de la boisson"
                      />
                    </View>
                    <View style={styles.editCol}>
                      <Text style={styles.editLabel}>Prix (€)</Text>
                      <TextInput
                        style={styles.input}
                        value={edited.price}
                        onChangeText={(value) => onChangeDrink(drink.id, 'price', value)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.saveButton, { backgroundColor: theme.primary }, isSaving && styles.saveButtonDisabled]}
                      onPress={() => saveDrink(drink.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator color={(theme.background.white || '#fff')} size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="save" size={18} color={(theme.background.white || '#fff')} />
                          <Text style={[styles.saveButtonText, { color: (theme.background.white || '#fff') }]}>Sauvegarder</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: theme.error }]}
                      onPress={() => deleteDrink(drink.id)}
                    >
                      <MaterialIcons name="delete" size={18} color={(theme.background.white || '#fff')} />
                      <Text style={[styles.deleteButtonText, { color: (theme.background.white || '#fff') }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  description: { fontSize: 14, marginBottom: 24, fontStyle: 'italic' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  addInputContainer: {
    flex: 1,
  },
  addLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  addInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  editRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  editCol: {
    flex: 1,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    gap: 6,
  },
  deleteButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default AdminAccompanimentsScreen;
