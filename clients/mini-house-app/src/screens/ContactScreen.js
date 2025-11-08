import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Hero from '../components/Hero';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

const ContactScreen = ({ navigation }) => {
  const { count } = useCart();
  const { logout } = useAuth();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('restaurant'); // 'restaurant' | 'problem'
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // FAQ statique (peut être reliée au backend plus tard)
  const FAQ_DATA = [
    {
      q: 'Comment suivre ma commande ?',
      a: "Vous pouvez suivre vos commandes dans l'onglet Commandes. Les statuts s'actualisent en temps réel.",
    },
    {
      q: 'Comment modifier ou annuler une commande ?',
      a: "Contactez rapidement le restaurant via la page Contact. Selon l'avancement, la modification ou l'annulation peut ne plus être possible.",
    },
    {
      q: 'Un problème de paiement ?',
      a: "Signalez le problème depuis la page Contact (type 'Signaler un problème') en décrivant la situation. Nous reviendrons vers vous.",
    },
    {
      q: 'Comment contacter le service client ?',
      a: "Utilisez la page Contact ou appelez-nous via le numéro indiqué dans le pied de page.",
    },
  ];
  const [openFaq, setOpenFaq] = useState([]); // indices ouverts

  const toggleFaq = (idx) => {
    setOpenFaq((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Merci d’indiquer votre nom.');
      return;
    }
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      Alert.alert('Email requis', 'Merci d’indiquer votre adresse email.');
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (!emailOk) {
      Alert.alert('Email invalide', 'Merci de saisir une adresse email valide.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message requis', 'Merci de décrire votre demande.');
      return;
    }
    try {
      setSending(true);
      await api.post('/site-info/contact', { name: name.trim(), email: emailTrimmed, type, message: message.trim() });
      setSending(false);
      setName(''); setEmail(''); setMessage(''); setType('restaurant');
      Alert.alert('Envoyé', 'Votre message a été transmis. Merci !');
    } catch (e) {
      setSending(false);
      Alert.alert('Erreur', "Impossible d'envoyer votre message pour le moment.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Header
        onCart={() => {
          console.log('🛒 ContactScreen - Clic sur Cart');
          // D'après les logs : ContactScreen est directement dans TabNavigator
          // Cart est dans HomeStack (TabNavigator > Home > Cart)
          // Il faut naviguer vers Home (TabNavigator) puis Cart (HomeStack)
          console.log('  - Navigation vers Home puis Cart');
          navigation.navigate('Home', { screen: 'Cart' });
        }}
        cartCount={count}
        notifications={notifications}
        notificationCount={notificationCount}
        onDeleteNotification={(notificationId) => {
          console.log('🗑️ ContactScreen - Suppression de notification:', notificationId);
          if (clearNotification) {
            clearNotification(notificationId);
          }
        }}
        onNotificationPress={(notif) => {
          console.log('🔔 ContactScreen - Clic sur notification:', notif);
          // Marquer la notification comme lue
          if (notif.id && markAsRead) {
            markAsRead(notif.id);
          }
          if (notif.orderId) {
            // Naviguer vers la page de commandes avec l'orderId en paramètre
            navigation.navigate('Orders', { orderId: notif.orderId });
          } else {
            navigation.navigate('Orders');
          }
        }}
        onNotifications={() => {
          console.log('🔔 ContactScreen - onNotifications appelé (fallback)');
          navigation.navigate('Orders');
        }}
        onProfile={() => {
          console.log('👤 ContactScreen - Clic sur Profile');
          // D'après les logs : ContactScreen est directement dans TabNavigator
          // Profile est dans HomeStack (TabNavigator > Home > Profile)
          // Il faut naviguer vers Home (TabNavigator) puis Profile (HomeStack)
          console.log('  - Navigation vers Home puis Profile');
          navigation.navigate('Home', { screen: 'Profile' });
        }}
        onLogout={logout}
        showCart={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Hero 
          title="Contactez-nous" 
          subtitle="Nous sommes là pour vous aider"
          image={require('../assets/hero-contact.jpg')}
        />
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: (theme.text.secondary || '#666') }]}>
            Vous pouvez contacter le restaurant ou signaler un problème.
          </Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: theme.background.border }, type === 'restaurant' && { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: theme.primary }]}
              onPress={() => setType('restaurant')}
            >
              <Text style={[styles.toggleText, type === 'restaurant' && { color: theme.primary, fontWeight: '600' }]}>Contacter le restaurant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: theme.background.border }, type === 'problem' && { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: theme.primary }]}
              onPress={() => setType('problem')}
            >
              <Text style={[styles.toggleText, type === 'problem' && { color: theme.primary, fontWeight: '600' }]}>Signaler un problème</Text>
            </TouchableOpacity>
          </View>

          {/* Nom (obligatoire) */}
          <View style={styles.labelRow}>
            <Text style={[styles.labelText, { color: theme.text.primary }]}>
              Nom<Text style={styles.required}> *</Text>
            </Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: (theme.background.white || '#fff'), color: theme.text.primary }]}
            placeholder="Votre nom"
            value={name}
            onChangeText={setName}
          />
          {/* Email (obligatoire) */}
          <View style={styles.labelRow}>
            <Text style={[styles.labelText, { color: theme.text.primary }]}>
              Email<Text style={styles.required}> *</Text>
            </Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: (theme.background.white || '#fff'), color: theme.text.primary }]}
            placeholder="Votre email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* Message (obligatoire) */}
          <View style={styles.labelRow}>
            <Text style={[styles.labelText, { color: theme.text.primary }]}>
              Message<Text style={styles.required}> *</Text>
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: (theme.background.white || '#fff'), color: theme.text.primary }]}
            placeholder="Votre message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={onSubmit} disabled={sending}>
            <Text style={[styles.submitText, { color: (theme.background.white || '#fff') }]}>{sending ? 'Envoi...' : 'Envoyer'}</Text>
          </TouchableOpacity>

          {/* FAQ */}
          <View style={styles.faqSection}>
            <Text style={[styles.faqTitle, { color: theme.text.primary }]}>FAQ</Text>
            {FAQ_DATA.map((item, idx) => {
              const isOpen = openFaq.includes(idx);
              return (
                <View key={`faq-${idx}`} style={[styles.faqItem, { backgroundColor: (theme.background.white || '#fff') }]}>
                  <TouchableOpacity style={styles.faqQuestionRow} onPress={() => toggleFaq(idx)}>
                    <Text style={styles.faqArrow}>{isOpen ? '▼' : '▶'}</Text>
                    <Text style={[styles.faqQuestionText, { color: theme.text.primary }]}>{item.q}</Text>
                  </TouchableOpacity>
                  {isOpen && (
                    <Text style={styles.faqAnswer}>{item.a}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <Footer onContact={() => navigation.navigate('Contact')} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f9f9f9', flexDirection: 'column' },
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: 16, paddingVertical: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  toggleText: { color: '#555', fontSize: 12 },
  labelRow: { marginBottom: 6 },
  labelText: { fontSize: 13, fontWeight: '600' },
  required: { color: '#ff3b30' },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 14 },
  textarea: { height: 140, textAlignVertical: 'top' },
  submitBtn: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 16, fontWeight: '600' },
  faqSection: { marginTop: 24 },
  faqTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  faqItem: { borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 10 },
  faqQuestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  faqArrow: { width: 18, textAlign: 'center', marginRight: 8 },
  faqQuestionText: { flex: 1, fontSize: 14, fontWeight: '600' },
  faqAnswer: { paddingHorizontal: 12, paddingBottom: 12, fontSize: 13, color: '#555' },
});

export default ContactScreen;
