import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const MenuItemQuestions = ({ questions, isExpanded, onToggle }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  
  return (
    <View style={[styles.questionsSection, { backgroundColor: (theme.background.white || '#fff') }]}>
      <TouchableOpacity onPress={onToggle}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
          {isExpanded ? '▼' : '▶'} Questions ({questions.length})
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.questionsContent}>
          <View style={styles.questionsList}>
            {questions.map(question => (
              <View key={question.id} style={styles.questionCard}>
                <Text style={[styles.questionAuthor, { color: theme.text.primary }]}>{question.userName}</Text>
                <Text style={[styles.questionText, { color: (theme.text.secondary || '#666') }]}>{question.text}</Text>
                {question.answer && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>Réponse du restaurant:</Text>
                    <Text style={styles.answerText}>{question.answer}</Text>
                  </View>
                )}
                <Text style={[styles.questionDate, { color: theme.text.tertiary }]}>{question.date}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  questionsSection: {
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
  questionsContent: {
    marginTop: 12,
  },
  questionsList: {},
  questionCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9c27b0',
  },
  questionAuthor: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  questionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  answerBox: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
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
    fontSize: 13,
    color: '#1b5e20',
    lineHeight: 18,
  },
  questionDate: {
    fontSize: 11,
  },
});

export default MenuItemQuestions;
