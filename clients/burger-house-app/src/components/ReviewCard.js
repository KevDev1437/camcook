import { StyleSheet, Text, View } from 'react-native';

/**
 * Composant pour afficher une carte d'avis
 * @param {Object} review - Objet avis contenant id, userName, rating, text, date
 */
const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return (
      <Text style={styles.stars}>
        {'★'.repeat(rating)}
        {'☆'.repeat(5 - rating)}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.author}>{review.userName}</Text>
        <View>{renderStars(review.rating)}</View>
      </View>
      <Text style={styles.text}>{review.text}</Text>
      <Text style={styles.date}>{review.date}</Text>
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
    borderLeftColor: '#22c55e',
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
    color: 'theme.text.primary',
  },
  stars: {
    fontSize: 12,
    color: '#ffc107',
  },
  text: {
    fontSize: 13,
    color: 'theme.text.secondary',
    lineHeight: 18,
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: 'theme.text.tertiary',
  },
});

export default ReviewCard;
