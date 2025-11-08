import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

// Screens
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';
import CartScreen from '../screens/CartScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MenuItemDetailScreen from '../screens/MenuItemDetailScreen';
import ContactScreen from '../screens/ContactScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrdersScreen from '../screens/OrdersScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 🧭 HomeStack : inclut maintenant HomeMain + MenuItemDetail + Cart
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MenuItemDetail"
        component={MenuItemDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 🧭 Tabs
const TabNavigator = () => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// 🧭 RootStack : sans MenuItemDetail
const RootStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 🧭 Main Navigator
const AppNavigator = () => {
  const { loading, isAuthenticated, user } = useAuth();

  // DEBUG : Log à chaque changement de user ou isAuthenticated
  useEffect(() => {
    console.log('[NAV] 🔄 AppNavigator - useEffect déclenché');
    console.log('[NAV] 🔄 AppNavigator - loading:', loading);
    console.log('[NAV] 🔄 AppNavigator - isAuthenticated:', isAuthenticated);
    console.log('[NAV] 🔄 AppNavigator - user:', user ? { id: user.id, email: user.email, role: user.role } : null);
  }, [loading, isAuthenticated, user]);

  // DEBUG : Log à chaque render pour voir l'état
  console.log('[NAV] 🔄 AppNavigator render - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user ? { id: user.id, email: user.email, role: user.role } : null);

  if (loading) {
    console.log('[NAV] ⏳ En cours de chargement...');
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Loading" component={() => null} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // MULTI-TENANT : Les owners de restaurants (rôle 'adminrestaurant') et superadmins peuvent accéder au dashboard admin
  // Le backend autorise les rôles 'adminrestaurant' et 'superadmin' pour les routes admin
  // IMPORTANT : Vérifier que user existe ET a un rôle avant de déterminer isAdmin
  const isAdmin = isAuthenticated && user && (user.role === 'superadmin' || user.role === 'adminrestaurant');

  // DEBUG : Log pour comprendre le problème de navigation (toujours afficher pour diagnostic)
  console.log('[NAV] ============================================');
  console.log('[NAV] AppNavigator - loading:', loading);
  console.log('[NAV] AppNavigator - isAuthenticated:', isAuthenticated);
  console.log('[NAV] AppNavigator - user:', user ? { id: user.id, email: user.email, role: user.role } : null);
  console.log('[NAV] AppNavigator - user?.role:', user?.role);
  console.log('[NAV] AppNavigator - user?.role === "adminrestaurant":', user?.role === 'adminrestaurant');
  console.log('[NAV] AppNavigator - user?.role === "superadmin":', user?.role === 'superadmin');
  console.log('[NAV] AppNavigator - isAdmin:', isAdmin);
  console.log('[NAV] AppNavigator - Navigation vers:', isAdmin ? 'AdminNavigator' : 'RootStack');
  console.log('[NAV] ============================================');

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        isAdmin ? (
          <AdminNavigator />
        ) : (
          <RootStack />
        )
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
