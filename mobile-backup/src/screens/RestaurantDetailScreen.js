import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const RestaurantDetailScreen = ({navigation}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.restaurantName}>Restaurant Demo</Text>
        <Text style={styles.restaurantDescription}>Cuisine traditionnelle</Text>
        <Text style={styles.restaurantRating}>⭐ 4.5 (120 avis)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Menu</Text>

        <View style={styles.menuItem}>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemName}>Plat 1</Text>
            <Text style={styles.menuItemDescription}>
              Description du plat délicieux
            </Text>
            <Text style={styles.menuItemPrice}>5000 FCFA</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuItemInfo}>
            <Text style={styles.menuItemName}>Plat 2</Text>
            <Text style={styles.menuItemDescription}>
              Un autre plat savoureux
            </Text>
            <Text style={styles.menuItemPrice}>7000 FCFA</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  restaurantDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  restaurantRating: {
    fontSize: 14,
    color: '#ff6b35',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  menuItem: {
    backgroundColor: '#fff',
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
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  addButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RestaurantDetailScreen;
