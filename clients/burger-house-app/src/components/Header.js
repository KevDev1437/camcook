import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';

/**
 * Header professionnel - Multi-Tenant
 * Affiche le logo et nom du restaurant depuis le RestaurantContext
 * @param {object} props - onNotifications, onProfile, onCart, notificationCount, cartCount, showCart
 */
const Header = ({
  onNotifications = () => {},
  onProfile = () => {},
  onCart = null,
  onLogout = null,
  notificationCount = 0,
  cartCount = 0,
  showCart = false, // Par défaut, ne pas afficher le panier (sauf si explicitement demandé pour les utilisateurs)
  notifications = [], // Liste des notifications à afficher dans le dropdown
  onNotificationPress = null, // Handler quand on clique sur une notification
  onDeleteNotification = null, // Handler pour supprimer une notification
  onReviews = null, // Handler pour naviguer vers les avis (admin)
  onContacts = null, // Handler pour naviguer vers les contacts (admin)
  showAdminActions = false, // Afficher les actions admin (Avis, Contact)
  unreadMessagesCount = 0, // Nombre de messages non lus pour afficher un badge sur l'icône enveloppe
}) => {
  const { restaurant } = useRestaurant();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  return (
    <View style={styles.container}>
      {/* Top bar - Logo et icônes */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          {/* Logo du restaurant depuis le context */}
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
          {/* Nom du restaurant depuis le context */}
          <Text style={styles.logoText}>{restaurant?.name || 'Restaurant'}</Text>
        </View>

        {/* Icônes droite */}
        <View style={styles.iconsContainer}>
          {showCart && onCart && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onCart}
              activeOpacity={0.7}
            >
              <MaterialIcons name="shopping-cart" size={24} color="theme.background.white" />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Actions admin (Avis et Contact) */}
          {showAdminActions && (
            <>
              {onReviews && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onReviews}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="rate-review" size={24} color="theme.background.white" />
                </TouchableOpacity>
              )}
              {onContacts && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onContacts}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="mail" size={24} color="theme.background.white" />
                  {unreadMessagesCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
          
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                // TOUJOURS ouvrir/fermer le dropdown, même s'il n'y a pas de notifications
                // Cela permet d'afficher le message "Aucune notification"
                setNotificationsOpen(!notificationsOpen);
                setMenuOpen(false); // Fermer le menu profil si ouvert
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="notifications" size={24} color="theme.background.white" />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {notificationsOpen && (
              <View style={styles.dropdown}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownHeaderText}>Notifications</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setNotificationsOpen(false);
                    }}
                    style={{ padding: 4 }}
                  >
                    <MaterialIcons name="close" size={18} color="theme.text.tertiary" />
                  </TouchableOpacity>
                </View>
                {notifications.length > 0 ? (
                  notifications.map((notif, idx) => (
                    <View key={idx} style={styles.dropdownItem}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => {
                          setNotificationsOpen(false); // Fermer d'abord le dropdown
                          // Attendre un peu avant de naviguer pour que le dropdown se ferme visuellement
                          setTimeout(() => {
                            if (onNotificationPress) {
                              // Si c'est une notification groupée, on peut naviguer vers la liste complète
                              // ou traiter la première notification du groupe
                              if (notif.grouped && notif.notifications && notif.notifications.length > 0) {
                                // Pour les notifications groupées, on navigue vers la première notification
                                onNotificationPress(notif.notifications[0]);
                              } else {
                                onNotificationPress(notif);
                              }
                            }
                          }, 200);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.dropdownText} numberOfLines={2}>
                              {notif.message || notif.title || 'Nouvelle notification'}
                            </Text>
                            {notif.grouped && notif.count > 1 && (
                              <View style={styles.groupedBadge}>
                                <Text style={styles.groupedBadgeText}>{notif.count}</Text>
                              </View>
                            )}
                          </View>
                          {notif.time && (
                            <Text style={styles.dropdownTime}>{notif.time}</Text>
                          )}
                          {notif.grouped && notif.notifications && notif.notifications.length > 1 && (
                            <Text style={styles.groupedText}>
                              {notif.notifications.length} notifications similaires
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      {onDeleteNotification && (
                        <TouchableOpacity
                          onPress={() => {
                            if (onDeleteNotification) {
                              // Si c'est une notification groupée, supprimer toutes les notifications du groupe
                              if (notif.grouped && notif.notifications) {
                                notif.notifications.forEach(n => {
                                  if (onDeleteNotification) {
                                    onDeleteNotification(n.id);
                                  }
                                });
                                // Supprimer aussi la notification groupée
                                onDeleteNotification(notif.id);
                              } else {
                                onDeleteNotification(notif.id);
                              }
                            }
                          }}
                          style={styles.deleteButton}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="delete-outline" size={18} color="theme.error" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.dropdownText}>Aucune notification</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setMenuOpen((v) => !v)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="account-circle" size={24} color="theme.background.white" />
            </TouchableOpacity>
            {menuOpen && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMenuOpen(false);
                    onProfile && onProfile();
                  }}
                >
                  <Text style={styles.dropdownText}>Mon profil</Text>
                </TouchableOpacity>
                {onLogout && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: '#d32f2f' }]}>Se déconnecter</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#22c55e',
    paddingTop: 40,
    paddingBottom: 12,
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'theme.background.white',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff1744',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'theme.background.white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: 'theme.background.white',
    borderRadius: 8,
    paddingVertical: 6,
    minWidth: 280,
    maxWidth: 320,
    maxHeight: 400,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'theme.background.border',
    zIndex: 100,
  },
  dropdownHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'theme.text.primary',
    textTransform: 'uppercase',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  dropdownText: {
    color: 'theme.text.primary',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  dropdownTime: {
    color: 'theme.text.tertiary',
    fontSize: 11,
    fontStyle: 'italic',
  },
  groupedBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupedBadgeText: {
    color: 'theme.background.white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  groupedText: {
    color: 'theme.text.secondary',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default Header;
