import { StyleSheet, Text, View } from 'react-native';

// Version sans bouton "En savoir plus" : on affiche tout le texte directement
const MenuItemDescription = ({ description, longDescription }) => {
  const fullText = longDescription || description || '';
  return (
    <View style={styles.descriptionSection}>
      <Text style={styles.longDescription}>{fullText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  longDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
  },
});

export default MenuItemDescription;
