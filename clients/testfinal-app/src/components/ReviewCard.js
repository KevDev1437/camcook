import { StyleSheet, Text, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

/**
 * Composant pour afficher une carte d'avis
 * @param {Object} review - Objet avis contenant id, userName, rating, text, date
 */
const ReviewCard = ({ review }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const renderStars = (rating) => {
    return (
      <Text style={styles.stars}>
        {'★'.repeat(rating)}
        {'☆'.repeat(5 - rating)}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { borderLeftColor: theme.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.author, { color: theme.text.primary }]}>{review.userName}</Text>
        <View>{renderStars(review.rating)}</View>
      </View>
      <Text style={[styles.text, { color: (theme.text.secondary || '#666') }]}>{review.text}</Text>
      <Text style={[styles.date, { color: theme.text.tertiary }]}>{review.date}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
  },
  stars: {
    fontSize: 12,
    color: '#ffc107',
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
  },
});

export default ReviewCard;
