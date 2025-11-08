import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import restaurantService from '../services/restaurantService';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const RestaurantDetailScreen = ({route, navigation}) => {
  const {restaurantId} = route.params;
  const { restaurant: contextRestaurant } = useRestaurant();
  const theme = getThemeColors(contextRestaurant);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantResponse, menuResponse] = await Promise.all([
        restaurantService.getRestaurantInfo(restaurantId),
        restaurantService.getMenuItems(restaurantId),
      ]);

      // restaurantService.getRestaurantInfo retourne directement les données
      if (restaurantResponse) {
        setRestaurant(restaurantResponse);
      }
      // restaurantService.getMenuItems retourne { success, data }
      if (menuResponse?.success) {
        setMenuItems(menuResponse.data);
      } else if (Array.isArray(menuResponse)) {
        // Si c'est directement un tableau
        setMenuItems(menuResponse);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = item => {
    // TODO: Implémenter l'ajout au panier
    Alert.alert('Panier', `${item.name} ajouté au panier`);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.light }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.light }]}>
        <Text style={{ color: theme.text.primary }}>Restaurant non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.light }]}>
      <View style={[styles.header, { backgroundColor: (theme.background.white || '#fff'), borderBottomColor: theme.background.border }]}>
        <Text style={[styles.restaurantName, { color: theme.text.primary }]}>{restaurant.name}</Text>
        <Text style={[styles.restaurantDescription, { color: (theme.text.secondary || '#666') }]}>
          {restaurant.description}
        </Text>
        <View style={styles.headerInfo}>
          <Text style={styles.restaurantRating}>
            ⭐ {restaurant.ratingAverage > 0 ? restaurant.ratingAverage : 'Nouveau'}
            {restaurant.ratingCount > 0 && ` (${restaurant.ratingCount} avis)`}
          </Text>
          <Text style={[styles.restaurantTime, { color: (theme.text.secondary || '#666') }]}>
            🕒 {restaurant.estimatedTime} min
          </Text>
        </View>
        <View style={styles.deliveryInfo}>
          {restaurant.hasPickup && (
            <Text style={[styles.deliveryBadge, { color: (theme.text.secondary || '#666') }]}>🏪 Sur place</Text>
          )}
          {restaurant.hasDelivery && (
            <Text style={[styles.deliveryBadge, { color: (theme.text.secondary || '#666') }]}>
              🚚 Livraison {restaurant.deliveryFee}€
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Menu</Text>

        {menuItems.length === 0 ? (
          <Text style={[styles.noDataText, { color: theme.text.tertiary }]}>Aucun plat disponible</Text>
        ) : (
          menuItems.map(item => (
            <View key={item.id} style={[styles.menuItem, { backgroundColor: (theme.background.white || '#fff') }]}>
              <View style={styles.menuItemInfo}>
                <View style={styles.menuItemHeader}>
                  <Text style={[styles.menuItemName, { color: theme.text.primary }]}>{item.name}</Text>
                  {item.isPopular && (
                    <Text style={[styles.popularBadge, { color: theme.primary, borderColor: theme.primary }]}>⭐ Populaire</Text>
                  )}
                </View>
                <Text style={[styles.menuItemDescription, { color: (theme.text.secondary || '#666') }]}>
                  {item.description}
                </Text>
                <Text style={[styles.menuItemPrice, { color: theme.primary }]}>{item.price}€</Text>
                {item.options && item.options.length > 0 && (
                  <Text style={[styles.menuItemOptions, { color: theme.text.tertiary }]}>
                    + {item.options[0].choices.length} accompagnements disponibles
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={() => handleAddToCart(item)}>
                <Text style={[styles.addButtonText, { color: (theme.background.white || '#fff') }]}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  restaurantDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  restaurantRating: {
    fontSize: 14,
  },
  restaurantTime: {
    fontSize: 14,
  },
  deliveryInfo: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryBadge: {
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 5,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  menuItem: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  popularBadge: {
    fontSize: 11,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  menuItemDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  menuItemOptions: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    fontWeight: 'bold',
  },
});

export default RestaurantDetailScreen;
