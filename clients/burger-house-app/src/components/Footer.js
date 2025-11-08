import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import api from '../config/api';
import { useRestaurant } from '../contexts/RestaurantContext';

/**
 * Footer professionnel - Multi-Tenant
 * Affiche les informations du restaurant depuis le RestaurantContext
 * @param {object} props - Callbacks et données
 */
const Footer = ({
  onAbout = () => {},
  onTerms = () => {},
  onPrivacy = () => {},
  onContact = () => {},
}) => {
  const { restaurant } = useRestaurant();
  const [contact, setContact] = useState({
    phone: '+33 1 23 45 67 89',
    email: 'contact@restaurant.com',
    address: '',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/site-info');
        const data = res?.data?.data || {};
        if (mounted) {
          // MULTI-TENANT: Priorité aux données du restaurant actuel
          // Utiliser restaurant.xxx en premier, puis site-info, puis fallback générique
          setContact({
            phone: restaurant?.phone || data.phone || '+33 1 23 45 67 89',
            email: restaurant?.email || data.email || 'contact@restaurant.com',
            address: restaurant?.street 
              ? `${restaurant.street}, ${restaurant.city}${restaurant.postalCode ? ` ${restaurant.postalCode}` : ''}`
              : data.address || '',
          });
        }
      } catch (e) {
        // MULTI-TENANT: Utiliser les données du restaurant en priorité
        if (mounted && restaurant) {
          setContact({
            phone: restaurant.phone || '+33 1 23 45 67 89',
            email: restaurant.email || 'contact@restaurant.com',
            address: restaurant.street 
              ? `${restaurant.street}, ${restaurant.city}${restaurant.postalCode ? ` ${restaurant.postalCode}` : ''}`
              : '',
          });
        } else if (mounted) {
          // Fallback générique si aucun restaurant
          setContact({
            phone: '+33 1 23 45 67 89',
            email: 'contact@restaurant.com',
            address: '',
          });
        }
      }
    })();
    return () => { mounted = false; };
  }, [restaurant]);

  const handlePhone = () => {
    if (contact.phone) {
      const tel = contact.phone.replace(/\s+/g, '');
      Linking.openURL(`tel:${tel}`);
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleWebsite = () => {
    // Utiliser le subdomain du restaurant si disponible, sinon URL par défaut
    const websiteUrl = restaurant?.subdomain 
      ? `https://${restaurant.subdomain}.camcook.com`
      : restaurant?.website || 'https://camcook.com';
    Linking.openURL(websiteUrl);
  };

  return (
    <View style={styles.container}>
      {/* Main footer content */}
      <ScrollView
        style={styles.content}
        scrollEnabled={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Section 1 - À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À Propos</Text>
          <TouchableOpacity
            style={styles.link}
            onPress={onAbout}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Qui sommes-nous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={handleWebsite}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Notre site</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={onContact}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Nous contacter</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2 - Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity
            style={styles.link}
            onPress={handlePhone}
            activeOpacity={0.7}
          >
            <MaterialIcons name="phone" size={14} color="theme.background.white" />
            <Text style={styles.linkText}>{contact.phone}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={handleEmail}
            activeOpacity={0.7}
          >
            <MaterialIcons name="email" size={14} color="theme.background.white" />
            <Text style={styles.linkText}>{contact.email}</Text>
          </TouchableOpacity>
          {contact.address ? (
            <View style={[styles.link, { marginTop: 2 }]}>
              <MaterialIcons name="place" size={14} color="theme.background.white" />
              <Text style={styles.linkText}>{contact.address}</Text>
            </View>
          ) : null}
        </View>

        {/* Section 3 - Légal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          <TouchableOpacity
            style={styles.link}
            onPress={onTerms}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Conditions d'utilisation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={onPrivacy}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Politique de confidentialité</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4 - Réseaux sociaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous suivre</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="facebook" size={20} color="theme.background.white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="camera-alt" size={20} color="theme.background.white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="video-camera-front" size={20} color="theme.background.white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <MaterialIcons name="language" size={20} color="theme.background.white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar - Copyright */}
      <View style={styles.bottomBar}>
        <Text style={styles.copyright}>
          © 2025 {restaurant?.name || 'Restaurant'}. Tous droits réservés.
        </Text>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#22c55e',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  section: {
    width: '48%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  linkText: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 6,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'theme.text.primary',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyright: {
    fontSize: 11,
    color: '#888',
  },
  version: {
    fontSize: 11,
    color: '#888',
  },
});

export default Footer;
