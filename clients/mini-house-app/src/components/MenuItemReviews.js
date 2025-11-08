import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const MenuItemReviews = ({ reviews, isExpanded, onToggle }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  return (
    <View style={[styles.reviewsSection, { backgroundColor: (theme.background.white || '#fff') }]}>
      <TouchableOpacity onPress={onToggle}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          {isExpanded ? '▼' : '▶'} Avis ({reviews.length})
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.reviewsContent}>
          <View style={styles.reviewsList}>
            {reviews.map(review => (
              <View key={review.id} style={[styles.reviewCard, { borderLeftColor: theme.primary }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewAuthor, { color: theme.text.primary }]}>{review.userName}</Text>
                  <View style={styles.starsContainer}>
                    {[...Array(5)].map((_, i) => (
                      <MaterialIcons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#ffc107"
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: (theme.text.secondary || '#666') }]}>{review.text}</Text>
                <Text style={[styles.reviewDate, { color: theme.text.tertiary }]}>{review.date}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  reviewsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewsContent: {
    marginTop: 12,
  },
  reviewsList: {},
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
  },
});

export default MenuItemReviews;
