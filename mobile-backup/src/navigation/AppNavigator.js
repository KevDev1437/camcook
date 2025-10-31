import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack Navigator
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{title: 'Restaurant'}}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{title: 'Panier'}}
      />
      <Stack.Screen
        name="Checkout"
        component={CartScreen}
        options={{title: 'Paiement'}}
      />
    </Stack.Navigator>
  );
};

// Bottom Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#ff6b35',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Accueil',
          tabBarIcon: ({color, size}) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Mes commandes',
          tabBarLabel: 'Commandes',
          tabBarIcon: ({color, size}) => (
            <Icon name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({color, size}) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
