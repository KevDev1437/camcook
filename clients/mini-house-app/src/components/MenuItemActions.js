import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const MenuItemActions = ({ quantity, onQuantityChange, onAddToCart, disabled = false, loading = false, pricePreview }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  return (
    <View style={[styles.actionSection, { backgroundColor: (theme.background.white || '#fff') }]}>
      <View style={styles.quantitySelector}>
        <TouchableOpacity
          onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
          style={styles.quantityButton}
        >
          <Text style={[styles.quantityButtonText, { color: theme.primary }]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.quantityText, { color: theme.text.primary }]}>{quantity}</Text>
        <TouchableOpacity
          onPress={() => onQuantityChange(quantity + 1)}
          style={styles.quantityButton}
        >
          <Text style={[styles.quantityButtonText, { color: theme.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.addToCartButton, { backgroundColor: theme.primary }, (disabled || loading) && styles.addToCartButtonDisabled]}
        onPress={() => { if (!disabled && !loading) onAddToCart(); }}
        activeOpacity={disabled || loading ? 1 : 0.7}
      >
        {loading ? (
          <ActivityIndicator color={(theme.background.white || '#fff')} />
        ) : (
          <MaterialIcons name="shopping-cart" size={24} color={(theme.background.white || '#fff')} />
        )}
        <Text style={[styles.addToCartText, { color: (theme.background.white || '#fff') }]}>
          {loading ? 'Ajout...' : `Ajouter au panier (${quantity})${pricePreview ? ` — ${pricePreview}` : ''}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionSection: {
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
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
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
  },
});

export default MenuItemActions;
