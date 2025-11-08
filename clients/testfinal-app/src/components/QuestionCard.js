import { StyleSheet, Text, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

/**
 * Composant pour afficher une carte de question/réponse - Multi-Tenant
 * Affiche le nom du restaurant depuis le RestaurantContext
 * @param {Object} question - Objet question contenant id, userName, text, answer, date
 */
const QuestionCard = ({ question }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.author, { color: theme.text.primary }]}>{question.userName}</Text>
        <Text style={[styles.date, { color: theme.text.tertiary }]}>{question.date}</Text>
      </View>

      {/* Question */}
      <Text style={[styles.questionText, { color: (theme.text.secondary || '#666') }]}>❓ {question.text}</Text>

      {/* Réponse si disponible */}
      {question.answer && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Réponse {restaurant?.name || 'Restaurant'}</Text>
          <Text style={styles.answerText}>{question.answer}</Text>
        </View>
      )}
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
    borderLeftColor: '#7c3aed',
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
  date: {
    fontSize: 11,
  },
  questionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  answerContainer: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
  },
});

export default QuestionCard;
