import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MenuItemQuestions = ({ questions, isExpanded, onToggle }) => {
  return (
    <View style={styles.questionsSection}>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.sectionTitle}>
          {isExpanded ? '▼' : '▶'} Questions ({questions.length})
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.questionsContent}>
          <View style={styles.questionsList}>
            {questions.map(question => (
              <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionAuthor}>{question.userName}</Text>
                <Text style={styles.questionText}>{question.text}</Text>
                {question.answer && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerLabel}>Réponse du restaurant:</Text>
                    <Text style={styles.answerText}>{question.answer}</Text>
                  </View>
                )}
                <Text style={styles.questionDate}>{question.date}</Text>
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
    color: '#333',
    marginBottom: 6,
  },
  questionText: {
    fontSize: 13,
    color: '#666',
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
    color: '#999',
  },
});

export default MenuItemQuestions;
