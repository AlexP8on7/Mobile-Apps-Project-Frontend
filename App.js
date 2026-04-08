import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import AdminScreen from './src/screens/AdminScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ShopScreen from './src/screens/ShopScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: '#228B22',
        tabBarStyle: { borderTopColor: '#8B4513', backgroundColor: '#ADFF2F' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home:   focused ? 'home'    : 'home-outline',
            Shop:   focused ? 'cart'    : 'cart-outline',
            Orders: focused ? 'receipt' : 'receipt-outline',
            Admin:  focused ? 'shield'  : 'shield-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      {user?.role === 'admin' && (
        <Tab.Screen name="Admin" component={AdminScreen} />
      )}
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { token } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
