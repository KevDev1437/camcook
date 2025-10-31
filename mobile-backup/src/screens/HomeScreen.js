import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const HomeScreen = ({navigation}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CamCook</Text>
        <Text style={styles.subtitle}>Commandez vos plats préférés</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégories</Text>
        <View style={styles.categoryContainer}>
          <TouchableOpacity style={styles.categoryCard}>
            <Text style={styles.categoryText}>🍕 Pizza</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryCard}>
            <Text style={styles.categoryText}>🍔 Burger</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryCard}>
            <Text style={styles.categoryText}>🍜 Asiatique</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryCard}>
            <Text style={styles.categoryText}>🥗 Salade</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurants populaires</Text>
        <TouchableOpacity
          style={styles.restaurantCard}
          onPress={() => navigation.navigate('RestaurantDetail')}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>Restaurant Demo</Text>
            <Text style={styles.restaurantDescription}>
              Cuisine traditionnelle
            </Text>
            <Text style={styles.restaurantRating}>⭐ 4.5 (120 avis)</Text>
          </View>
        </TouchableOpacity>
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
    backgroundColor: '#ff6b35',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  restaurantRating: {
    fontSize: 14,
    color: '#ff6b35',
  },
});

export default HomeScreen;
