import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MenuItemOptions = ({ options, selectedOptions, onOptionChange, isExpanded, onToggle }) => {
  if (!options || options.length === 0) return null;

  // Helpers pour gérer des structures d'options hétérogènes
  const getChoiceKey = (choice, optionId, idx) => {
    if (choice && typeof choice === 'object') {
      return (
        choice.id ?? choice.value ?? choice.key ?? choice.name ?? `${optionId}-choice-${idx}`
      );
    }
    return `${optionId}-${String(choice)}`;
  };

  const getChoiceValue = (choice) => {
    if (choice && typeof choice === 'object') {
      return choice.value ?? choice.id ?? choice.name ?? JSON.stringify(choice);
    }
    return choice;
  };

  const getChoiceLabel = (choice) => {
    if (choice && typeof choice === 'object') {
      return choice.label ?? choice.name ?? String(choice.value ?? choice.id ?? '');
    }
    return String(choice);
  };

  return (
    <View style={styles.optionsSection}>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.sectionTitle}>
          {isExpanded ? '▼' : '▶'} Compléments
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.optionsContent}>
          {options.map((option, optIdx) => (
            <View key={option?.id ?? option?.name ?? `option-${optIdx}`} style={styles.optionGroup}>
              <Text style={styles.optionName}>{option.name}</Text>
              
              {option.type === 'radio' && (
                <View style={styles.choicesContainer}>
                  {option.choices.map((choice, idx) => {
                    const key = getChoiceKey(choice, option?.id ?? optIdx, idx);
                    const value = getChoiceValue(choice);
                    const label = getChoiceLabel(choice);
                    const isSelected = selectedOptions[option.id] === value;
                    return (
                    <TouchableOpacity
                      key={key}
                      style={styles.radioButton}
                      onPress={() => onOptionChange(option.id, value, 'radio')}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      />
                      <Text style={styles.choiceText}>{label}</Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              
              {option.type === 'checkbox' && (
                <View style={styles.choicesContainer}>
                  {option.choices.map((choice, idx) => {
                    const key = getChoiceKey(choice, option?.id ?? optIdx, idx);
                    const value = getChoiceValue(choice);
                    const label = getChoiceLabel(choice);
                    const selectedArray = selectedOptions[option.id] || [];
                    const isChecked = selectedArray.includes(value);
                    return (
                    <TouchableOpacity
                      key={key}
                      style={styles.checkboxButton}
                      onPress={() => onOptionChange(option.id, value, 'checkbox')}
                    >
                      <View style={styles.checkbox}>
                        {isChecked && (
                          <MaterialIcons name="check" size={16} color="theme.background.white" />
                        )}
                      </View>
                      <Text style={styles.choiceText}>{label}</Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  optionsSection: {
    backgroundColor: 'theme.background.white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'theme.text.primary',
  },
  optionsContent: {
    marginTop: 12,
  },
  optionGroup: {
    marginBottom: 16,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'theme.text.primary',
    marginBottom: 10,
  },
  choicesContainer: {
    marginLeft: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 10,
  },
  radioCircleSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'theme.background.white',
  },
  choiceText: {
    fontSize: 14,
    color: 'theme.text.primary',
  },
});

export default MenuItemOptions;
