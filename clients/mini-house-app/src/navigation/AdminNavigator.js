import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminAccompanimentsScreen from '../screens/admin/AdminAccompanimentsScreen';
import AdminContactsScreen from '../screens/admin/AdminContactsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminMenuScreen from '../screens/admin/AdminMenuScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminPaymentsScreen from '../screens/admin/AdminPaymentsScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminReviewsScreen from '../screens/admin/AdminReviewsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack pour gérer la navigation vers AdminProfile, AdminReviews et AdminContacts depuis le Header
const AdminStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain" component={AdminTabNavigator} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
      <Stack.Screen name="AdminContacts" component={AdminContactsScreen} />
    </Stack.Navigator>
  );
};

// Tab Navigator pour les onglets principaux
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { height: 60, paddingBottom: 6 },
      }}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{
        title: 'Dashboard',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" color={color} size={size} />,
        headerShown: false,
      }} />
      <Tab.Screen name="AdminMenu" component={AdminMenuScreen} options={{
        title: 'Menu',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="restaurant-menu" color={color} size={size} />,
        headerShown: false,
      }} />
      <Tab.Screen name="AdminAccompaniments" component={AdminAccompanimentsScreen} options={{
        title: 'Accompagnements',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="fastfood" color={color} size={size} />,
        headerShown: false,
      }} />
      <Tab.Screen name="AdminOrders" component={AdminOrdersScreen} options={{
        title: 'Commandes',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt" color={color} size={size} />,
        headerShown: false,
      }} />
      <Tab.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{
        title: 'Paiements',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="payment" color={color} size={size} />,
        headerShown: false,
      }} />
      <Tab.Screen name="AdminUsers" component={AdminUsersScreen} options={{
        title: 'Utilisateurs',
        tabBarIcon: ({ color, size }) => <MaterialIcons name="people" color={color} size={size} />,
        headerShown: false,
      }} />
    </Tab.Navigator>
  );
};

const AdminNavigator = () => {
  return <AdminStackNavigator />;
};

export default AdminNavigator;
