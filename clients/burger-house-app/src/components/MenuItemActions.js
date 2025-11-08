import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MenuItemActions = ({ quantity, onQuantityChange, onAddToCart, disabled = false, loading = false, pricePreview }) => {
  return (
    <View style={styles.actionSection}>
      <View style={styles.quantitySelector}>
        <TouchableOpacity
          onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
          style={styles.quantityButton}
        >
          <Text style={styles.quantityButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity
          onPress={() => onQuantityChange(quantity + 1)}
          style={styles.quantityButton}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.addToCartButton, (disabled || loading) && styles.addToCartButtonDisabled]}
        onPress={() => { if (!disabled && !loading) onAddToCart(); }}
        activeOpacity={disabled || loading ? 1 : 0.7}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <MaterialIcons name="shopping-cart" size={24} color="#fff" />
        )}
        <Text style={styles.addToCartText}>
          {loading ? 'Ajout...' : `Ajouter au panier (${quantity})${pricePreview ? ` — ${pricePreview}` : ''}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionSection: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  quantityButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addToCartButtonDisabled: {
    opacity: 0.6,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MenuItemActions;
