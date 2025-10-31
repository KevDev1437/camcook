import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';

const CartScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.itemsContainer}>
        <View style={styles.cartItem}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>Plat 1</Text>
            <Text style={styles.itemPrice}>5000 FCFA</Text>
          </View>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityButton}>
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>1</Text>
            <TouchableOpacity style={styles.quantityButton}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>5000 FCFA</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutButtonText}>Commander</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  itemsContainer: {
    flex: 1,
    padding: 15,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#ff6b35',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#ff6b35',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  checkoutButton: {
    backgroundColor: '#ff6b35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CartScreen;
