import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const MenuItemHeader = ({ name, price, rating, ratingCount }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  return (
    <View style={[styles.headerSection, { backgroundColor: (theme.background.white || '#fff') }]}>
      <View style={styles.nameAndPrice}>
        <Text style={[styles.itemName, { color: theme.text.primary }]}>{name}</Text>
        <Text style={[styles.itemPrice, { color: theme.primary }]}>{price.toFixed(2)}€</Text>
      </View>

      <View style={styles.ratingRow}>
        <MaterialIcons name="star" size={16} color="#ffc107" />
        <Text style={[styles.ratingText, { color: (theme.text.secondary || '#666') }]}>
          {rating} ({ratingCount} avis)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  nameAndPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  itemPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 6,
  },
});

export default MenuItemHeader;
