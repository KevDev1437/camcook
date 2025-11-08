import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const MenuItemHeader = ({ name, price, rating, ratingCount }) => {
  return (
    <View style={styles.headerSection}>
      <View style={styles.nameAndPrice}>
        <Text style={styles.itemName}>{name}</Text>
        <Text style={styles.itemPrice}>{price.toFixed(2)}€</Text>
      </View>

      <View style={styles.ratingRow}>
        <MaterialIcons name="star" size={16} color="#ffc107" />
        <Text style={styles.ratingText}>
          {rating} ({ratingCount} avis)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    backgroundColor: 'theme.background.white',
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
    color: 'theme.text.primary',
    flex: 1,
  },
  itemPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22c55e',
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: 'theme.text.secondary',
    marginLeft: 6,
  },
});

export default MenuItemHeader;
