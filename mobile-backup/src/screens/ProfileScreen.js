import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';

const ProfileScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <Text style={styles.userName}>John Doe</Text>
        <Text style={styles.userEmail}>john.doe@example.com</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>📝 Modifier le profil</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>📍 Mes adresses</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>💳 Moyens de paiement</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>⭐ Restaurants favoris</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>⚙️ Paramètres</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>ℹ️ Aide & Support</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]}>
          <Text style={[styles.menuItemText, styles.logoutText]}>
            🚪 Déconnexion
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 15,
  },
  menuItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#999',
  },
  logoutItem: {
    marginTop: 20,
  },
  logoutText: {
    color: '#f44336',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
