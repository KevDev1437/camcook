import { Image, StyleSheet, View } from 'react-native';

const MenuItemImage = ({ images }) => {
  return (
    <View style={styles.imageContainer}>
      {images && images.length > 0 ? (
        <Image source={{ uri: images[0] }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.placeholderImage]}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoPlaceholder}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
});

export default MenuItemImage;
