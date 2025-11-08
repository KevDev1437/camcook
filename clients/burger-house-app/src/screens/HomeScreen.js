import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import restaurantService from '../services/restaurantService';

const HomeScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();
  const { restaurant, restaurantId, loading: restaurantLoading } = useRestaurant();
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (restaurantId) {
      loadMenuItems();
    }
  }, [restaurantId]);

  useEffect(() => {
    // Filtrer les plats selon la recherche
    if (searchText.trim() === '') {
      setFilteredItems(menuItems);
    } else {
      const filtered = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchText, menuItems]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      // Récupérer le menu du restaurant
      const menuResponse = await restaurantService.getMenuItems(restaurantId);
      if (menuResponse.success) {
        setMenuItems(menuResponse.data);
        setFilteredItems(menuResponse.data);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      Alert.alert('Erreur', 'Impossible de charger le menu');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemPress = (menuItem) => {
    console.log('🔍 Clic sur plat:', menuItem.name, 'ID:', menuItem.id);
    // Navigation directe vers MenuItemDetail avec restaurantId du context
    navigation.navigate('MenuItemDetail', {
      menuItemId: menuItem.id,
      restaurantId: restaurantId,
    });
  };

  // Afficher un loader pendant le chargement du restaurant ou du menu
  if (restaurantLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const handleSearch = (text) => {
    setSearchText(text);
  };

  const handleCart = () => {
    // HomeScreen est déjà dans HomeStack: navigation directe vers Cart fonctionne
    navigation.navigate('Cart');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.mainContainer}>
      {/* HEADER PROFESSIONNEL - Fixe en haut */}
      <Header
        onCart={() => navigation.navigate('Cart')}
        cartCount={count}
        notifications={notifications}
        notificationCount={notificationCount}
        onDeleteNotification={(notificationId) => {
          console.log('🗑️ HomeScreen - Suppression de notification:', notificationId);
          if (clearNotification) {
            clearNotification(notificationId);
          }
        }}
        onNotificationPress={(notif) => {
          console.log('🔔 HomeScreen - Clic sur notification:', notif);
          // Marquer la notification comme lue
          if (notif.id && markAsRead) {
            markAsRead(notif.id);
          }
          if (notif.orderId) {
            // Naviguer vers la page de commandes avec l'orderId en paramètre
            navigation.navigate('Orders', { orderId: notif.orderId });
          } else {
            // Fallback : aller à la page de commandes
            navigation.navigate('Orders');
          }
        }}
        onNotifications={() => {
          console.log('🔔 HomeScreen - onNotifications appelé (fallback)');
          navigation.navigate('Orders');
        }}
        onProfile={handleProfile}
        onLogout={logout}
        showCart={true}
      />

      {/* CONTENU SCROLLABLE - Avec Footer à l'intérieur */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Hero 
          image={restaurant?.coverImage || require('../assets/hero-home.jpg')}
          title={restaurant?.name || 'Bienvenue'}
          subtitle={restaurant?.description || 'Des saveurs à portée de main'}
        />
        {/* Titre centré */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Nos Menus</Text>
        </View>

        {/* Section Menu - Grille Moderne */}
        <View style={styles.section}>
          {filteredItems.length === 0 ? (
            <Text style={styles.noDataText}>
              {searchText ? 'Aucun plat ne correspond à votre recherche' : 'Aucun plat disponible'}
            </Text>
          ) : (
            <View style={styles.gridContainer}>
              {filteredItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridCard}
                  onPress={() => handleMenuItemPress(item)}
                  activeOpacity={0.9}
                >
                  {/* Image ou Vidéo */}
                  <View style={styles.cardImageContainer}>
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        style={styles.cardImage}
                      />
                    ) : (
                      <View style={[styles.cardImage, styles.placeholderCard]}>
                        <Image
                          source={require('../assets/logo.png')}
                          style={styles.logoPlaceholder}
                        />
                      </View>
                    )}
                    
                    {/* Overlay sombre avec texte */}
                    <View style={styles.overlay}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Espacement bas pour separation du Footer */}
        <View style={styles.contentSpacer} />

        {/* FOOTER PROFESSIONNEL - Scroll avec le contenu */}
        <Footer onContact={() => navigation.navigate('Contact')} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  titleContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginVertical: 40,
  },
  /* Grille moderne */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  gridCard: {
    width: '48%',
    marginBottom: 16,
    marginHorizontal: '1%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  placeholderCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  /* Overlay avec texte */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  contentSpacer: {
    height: 20,
  },
});

export default HomeScreen;
