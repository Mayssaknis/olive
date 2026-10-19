import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList, TabParamList } from './types';
import { colors } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';

import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { ApportsScreen } from '../screens/ApportsScreen';
import { ProductionScreen } from '../screens/ProductionScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { ClientDetailScreen } from '../screens/ClientDetailScreen';
import { ClientFormScreen } from '../screens/ClientFormScreen';
import { ApportFormScreen } from '../screens/ApportFormScreen';
import { ApportDetailScreen } from '../screens/ApportDetailScreen';
import { YieldFormScreen } from '../screens/YieldFormScreen';
import { StockScreen } from '../screens/StockScreen';
import { LivraisonsScreen } from '../screens/LivraisonsScreen';
import { LivraisonFormScreen } from '../screens/LivraisonFormScreen';
import { FacturesScreen } from '../screens/FacturesScreen';
import { FactureDetailScreen } from '../screens/FactureDetailScreen';
import { FactureFormScreen } from '../screens/FactureFormScreen';
import { EmployeesScreen } from '../screens/EmployeesScreen';
import { EmployeeFormScreen } from '../screens/EmployeeFormScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream,
    primary: colors.olive,
    card: colors.white,
    text: colors.textPrimary,
    border: colors.softGray,
  },
};

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<keyof TabParamList, IconName> = {
  Dashboard: 'grid-outline',
  Clients: 'people-outline',
  Apports: 'download-outline',
  Production: 'water-outline',
  More: 'menu-outline',
};

function tabIcon(name: keyof TabParamList) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <View>
      <Ionicons name={(focused ? TAB_ICONS[name].replace('-outline', '') : TAB_ICONS[name]) as IconName} size={size} color={color} />
    </View>
  );
}

function Tabs() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.olive },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.olive,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.softGray },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('Tableau de bord'), tabBarLabel: t('Accueil'), tabBarIcon: tabIcon('Dashboard') }} />
      <Tab.Screen name="Clients" component={ClientsScreen} options={{ title: t('Clients'), tabBarLabel: t('Clients'), tabBarIcon: tabIcon('Clients') }} />
      <Tab.Screen name="Apports" component={ApportsScreen} options={{ title: t('Apports'), tabBarLabel: t('Apports'), tabBarIcon: tabIcon('Apports') }} />
      <Tab.Screen name="Production" component={ProductionScreen} options={{ title: t('Production'), tabBarLabel: t('Production'), tabBarIcon: tabIcon('Production') }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ title: t('Plus'), tabBarLabel: t('Plus'), tabBarIcon: tabIcon('More') }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  const stackHeader = {
    headerStyle: { backgroundColor: colors.olive },
    headerTintColor: colors.white,
    headerTitleStyle: { fontWeight: '700' as const },
    headerBackTitle: t('Retour'),
  };

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={stackHeader}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: t('Fiche client') }} />
            <Stack.Screen name="ClientForm" component={ClientFormScreen} options={({ route }) => ({ title: route.params?.client ? t('Modifier le client') : t('Nouveau client') })} />
            <Stack.Screen name="ApportForm" component={ApportFormScreen} options={({ route }) => ({ title: route.params?.apport ? t('Modifier l’apport') : t('Nouvel apport') })} />
            <Stack.Screen name="ApportDetail" component={ApportDetailScreen} options={{ title: t('Détail de l’apport') }} />
            <Stack.Screen name="YieldForm" component={YieldFormScreen} options={{ title: t('Saisie de production') }} />
            <Stack.Screen name="Stock" component={StockScreen} options={{ title: t('Stock d’huile') }} />
            <Stack.Screen name="Livraisons" component={LivraisonsScreen} options={{ title: t('Livraisons') }} />
            <Stack.Screen name="LivraisonForm" component={LivraisonFormScreen} options={{ title: t('Nouvelle livraison') }} />
            <Stack.Screen name="Factures" component={FacturesScreen} options={{ title: t('Factures') }} />
            <Stack.Screen name="FactureDetail" component={FactureDetailScreen} options={{ title: t('Détail de la facture') }} />
            <Stack.Screen name="FactureForm" component={FactureFormScreen} options={{ title: t('Nouvelle facture') }} />
            <Stack.Screen name="Employees" component={EmployeesScreen} options={{ title: t('Employés') }} />
            <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} options={({ route }) => ({ title: route.params?.employee ? t('Modifier l’employé') : t('Nouvel employé') })} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('Notifications') }} />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: t('Rapports') }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: t('Historique') }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('Mon profil') }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('Réglages') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
