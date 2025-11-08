import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import restaurantService from '../services/restaurantService';

const RestaurantDetailScreen = ({route, navigation}) => {
  const {restaurantId} = route.params;
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Restaurant non trouvé</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{restaurant.name}</Text>
        <Text style={styles.restaurantDescription}>
          {restaurant.description}
        </Text>
        <View style={styles.headerInfo}>
          <Text style={styles.restaurantRating}>
            ⭐ {restaurant.ratingAverage > 0 ? restaurant.ratingAverage : 'Nouveau'}
            {restaurant.ratingCount > 0 && ` (${restaurant.ratingCount} avis)`}
          </Text>
          <Text style={styles.restaurantTime}>
            🕒 {restaurant.estimatedTime} min
          </Text>
        </View>
        <View style={styles.deliveryInfo}>
          {restaurant.hasPickup && (
            <Text style={styles.deliveryBadge}>🏪 Sur place</Text>
          )}
          {restaurant.hasDelivery && (
            <Text style={styles.deliveryBadge}>
              🚚 Livraison {restaurant.deliveryFee}€
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu</Text>

        {menuItems.length === 0 ? (
          <Text style={styles.noDataText}>Aucun plat disponible</Text>
        ) : (
          menuItems.map(item => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <View style={styles.menuItemHeader}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  {item.isPopular && (
                    <Text style={styles.popularBadge}>⭐ Populaire</Text>
                  )}
                </View>
                <Text style={styles.menuItemDescription}>
                  {item.description}
                </Text>
                <Text style={styles.menuItemPrice}>{item.price}€</Text>
                {item.options && item.options.length > 0 && (
                  <Text style={styles.menuItemOptions}>
                    + {item.options[0].choices.length} accompagnements disponibles
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}>
                <Text style={styles.addButtonText}>Ajouter</Text>
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
    backgroundColor: 'theme.background.light',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'theme.background.light',
  },
  header: {
    backgroundColor: 'theme.background.white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'theme.background.border',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'theme.text.primary',
    marginBottom: 5,
  },
  restaurantDescription: {
    fontSize: 16,
    color: 'theme.text.secondary',
    marginBottom: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  restaurantRating: {
    fontSize: 14,
    color: '#22c55e',
  },
  restaurantTime: {
    fontSize: 14,
    color: 'theme.text.secondary',
  },
  deliveryInfo: {
    flexDirection: 'row',
    gap: 10,
  },
  deliveryBadge: {
    fontSize: 12,
    color: 'theme.text.secondary',
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
    color: 'theme.text.primary',
  },
  noDataText: {
    textAlign: 'center',
    color: 'theme.text.tertiary',
    fontSize: 16,
    marginTop: 20,
  },
  menuItem: {
    backgroundColor: 'theme.background.white',
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
    color: 'theme.text.primary',
    marginRight: 8,
  },
  popularBadge: {
    fontSize: 11,
    color: '#22c55e',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  menuItemDescription: {
    fontSize: 14,
    color: 'theme.text.secondary',
    marginBottom: 5,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 3,
  },
  menuItemOptions: {
    fontSize: 12,
    color: 'theme.text.tertiary',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'theme.background.white',
    fontWeight: 'bold',
  },
});

export default RestaurantDetailScreen;
