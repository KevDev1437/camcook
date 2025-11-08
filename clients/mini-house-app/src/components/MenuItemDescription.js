import { StyleSheet, Text, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

// Version sans bouton "En savoir plus" : on affiche tout le texte directement
const MenuItemDescription = ({ description, longDescription }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const fullText = longDescription || description || '';
  return (
    <View style={[styles.descriptionSection, { backgroundColor: (theme.background.white || '#fff') }]}>
      <Text style={[styles.longDescription, { color: (theme.text.secondary || '#666') }]}>{fullText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  longDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});

export default MenuItemDescription;
