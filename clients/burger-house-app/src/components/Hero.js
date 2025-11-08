import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';

// Section Hero (bannière) affichée juste après le Header.
// Support pour images de fond et carrousel d'images/vidéos.
// Multi-Tenant : Utilise le nom du restaurant depuis le RestaurantContext
const Hero = ({ 
  title = null, // Si null, utilise restaurant.name
  subtitle = null, // Si null, utilise restaurant.description
  height = 200,
  image = null // Image locale (require) ou URL (string)
}) => {
  const { restaurant } = useRestaurant();
  
  // Utiliser les données du restaurant si disponibles
  const heroTitle = title || restaurant?.name || 'Bienvenue';
  const heroSubtitle = subtitle || restaurant?.description || 'Des saveurs à portée de main';
  const heroImage = image || restaurant?.coverImage || null;

  return (
    <View style={[styles.container, { height }] }>
      {heroImage && (
        <Image 
          source={typeof heroImage === 'string' ? { uri: heroImage } : heroImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.overlay} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{heroTitle}</Text>
        <Text style={styles.subtitle}>{heroSubtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#222',
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  textWrap: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 16,
  },
  title: {
    color: 'theme.background.white',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: 'theme.background.border',
    fontSize: 13,
    marginTop: 6,
  },
});

export default Hero;
