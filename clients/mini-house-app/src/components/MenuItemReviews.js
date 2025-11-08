import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MenuItemReviews = ({ reviews, isExpanded, onToggle }) => {
  return (
    <View style={styles.reviewsSection}>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.sectionTitle}>
          {isExpanded ? '▼' : '▶'} Avis ({reviews.length})
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.reviewsContent}>
          <View style={styles.reviewsList}>
            {reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.userName}</Text>
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
                <Text style={styles.reviewText}>{review.text}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    borderLeftColor: '#22c55e',
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
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
});

export default MenuItemReviews;
