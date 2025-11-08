import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Composant pour sélectionner une note (étoiles)
 * @param {number} rating - Note actuelle (1-5)
 * @param {function} onRatingChange - Callback quand la note change
 */
const RatingComponent = ({ rating = 0, onRatingChange }) => {
  const handleStarPress = (star) => {
    if (onRatingChange) {
      onRatingChange(star);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
          >
            <Text
              style={[
                styles.star,
                rating >= star && styles.starActive,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.ratingText}>
          {rating === 1 && 'Très mauvais'}
          {rating === 2 && 'Mauvais'}
          {rating === 3 && 'Bon'}
          {rating === 4 && 'Très bon'}
          {rating === 5 && 'Excellent'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    marginHorizontal: 4,
  },
  star: {
    fontSize: 32,
    color: '#ddd',
  },
  starActive: {
    color: '#ffc107',
  },
  ratingText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffc107',
  },
});

export default RatingComponent;
