import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';

// Screens
import CartScreen from '../screens/CartScreen';
import ContactScreen from '../screens/ContactScreen';
import HomeScreen from '../screens/HomeScreen';
import MenuItemDetailScreen from '../screens/MenuItemDetailScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrdersScreen from '../screens/OrdersScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// 🧭 Orders Stack Navigator (Orders + OrderDetail)
const OrdersStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="OrdersMain"
        component={OrdersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 🧭 Home Stack Navigator (HomeScreen + MenuItemDetail)
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="MenuItemDetail"
        component={MenuItemDetailScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

// Bottom Tab Navigator - Main Navigator
// Bottom Tab Navigator - Main tabs
const Tabs = () => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text.tertiary,
        tabBarHideOnKeyboard: false,
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
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Commandes',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: false,
          title: 'Contact',
          tabBarLabel: 'Contact',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="contact-support" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main navigator renders tabs directly (Cart is inside HomeStack to keep tab bar visible)
const MainNavigator = () => <Tabs />;

export default MainNavigator;
