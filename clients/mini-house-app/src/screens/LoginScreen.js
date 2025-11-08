import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      return Alert.alert('Connexion', 'Veuillez saisir votre email et votre mot de passe.');
    }
    try {
      setLoading(true);
      const res = await login(email.trim(), password);
      if (!res?.success) {
        Alert.alert('Connexion', res?.message || 'Identifiants invalides');
      }
    } catch (e) {
      Alert.alert('Connexion', typeof e === 'string' ? e : 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.logoContainer}>
        {restaurant?.logo ? (
          <Image
            source={{ uri: restaurant.logo }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Admin ou Client</Text>

        <TextInput
          placeholder="Email (ou nom d'utilisateur)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]} disabled={loading} onPress={onSubmit}>
          <Text style={styles.buttonText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Pas de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.registerLink, { color: theme.primary }]}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  registerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
  },
  registerLink: {
    fontWeight: '700',
  },
});

export default LoginScreen;
