import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    const result = await register(name, email, phone, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erreur', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: (theme.background.white || '#fff') }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
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
          <Text style={[styles.title, { color: theme.primary }]}>Créer un compte</Text>
          <Text style={[styles.subtitle, { color: (theme.text.secondary || '#666') }]}>Rejoignez {restaurant?.name || 'nous'} aujourd'hui</Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background.light, color: theme.text.primary }]}
              placeholder="Nom complet"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.background.light, color: theme.text.primary }]}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.background.light, color: theme.text.primary }]}
              placeholder="Téléphone (ex: +237600000000)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.background.light, color: theme.text.primary }]}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.background.light, color: theme.text.primary }]}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={(theme.background.white || '#fff')} />
              ) : (
                <Text style={[styles.buttonText, { color: (theme.background.white || '#fff') }]}>S'inscrire</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: (theme.text.secondary || '#666') }]}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  input: {
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ffb399',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
