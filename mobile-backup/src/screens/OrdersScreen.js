import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';

const OrdersScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Commande #CC123456</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>En cours</Text>
          </View>
        </View>
        <Text style={styles.restaurantName}>Restaurant Demo</Text>
        <Text style={styles.orderDate}>30 Oct 2025, 14:30</Text>
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>5000 FCFA</Text>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Détails</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Commande #CC123455</Text>
          <View style={[styles.statusBadge, styles.statusCompleted]}>
            <Text style={styles.statusText}>Terminée</Text>
          </View>
        </View>
        <Text style={styles.restaurantName}>Restaurant Demo 2</Text>
        <Text style={styles.orderDate}>29 Oct 2025, 19:00</Text>
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>7500 FCFA</Text>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Détails</Text>
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
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusCompleted: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  restaurantName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  detailsButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  detailsButtonText: {
    color: '#ff6b35',
    fontWeight: 'bold',
  },
});

export default OrdersScreen;
