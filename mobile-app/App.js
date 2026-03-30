import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import GymScreen from './src/screens/GymScreen';
import LearningScreen from './src/screens/LearningScreen';
import ContentScreen from './src/screens/ContentScreen';
import BodyWeightScreen from './src/screens/BodyWeightScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SocialScreen from './src/screens/SocialScreen';
import { getToken } from './src/lib/storage';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0f172a',
    card: '#1e293b',
    border: 'rgba(255,255,255,0.07)',
    text: '#ffffff',
  },
};

const ICONS = {
  Dashboard:  { active: 'grid',          inactive: 'grid-outline' },
  Habits:     { active: 'checkbox',      inactive: 'checkbox-outline' },
  Social:     { active: 'people',        inactive: 'people-outline' },
  Gym:        { active: 'barbell',       inactive: 'barbell-outline' },
  Learning:   { active: 'book',          inactive: 'book-outline' },
  Content:    { active: 'videocam',      inactive: 'videocam-outline' },
  Weight:     { active: 'scale',         inactive: 'scale-outline' },
  Goals:      { active: 'trophy',        inactive: 'trophy-outline' },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function checkToken() {
      try {
        const token = await getToken();
        if (token) setIsAuthenticated(true);
      } catch (e) {
        console.warn('Auth check failed:', e.message);
      } finally {
        setIsInitializing(false);
      }
    }
    checkToken();
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.splashText}>LifeTracker</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <AuthScreen onLoginSuccess={() => setIsAuthenticated(true)} />
      </SafeAreaView>
    );
  }

function MainTabs() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: '#1e293b', shadowOpacity: 0, elevation: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
          headerTitleStyle: { color: '#fff', fontWeight: '700', fontSize: 17 },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#8b5cf6',
          tabBarInactiveTintColor: '#475569',
          tabBarStyle: { backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingBottom: 6, paddingTop: 4, height: 62 },
          tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = ICONS[route.name];
            return <Ionicons name={focused ? icons.active : icons.inactive} size={size - 2} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={({ navigation }) => ({
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, paddingRight: 16 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar')} hitSlop={{top:10,bottom:10,left:10,right:10}}><Ionicons name="calendar-outline" size={24} color="#e2e8f0" /></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={{top:10,bottom:10,left:10,right:10}}><Ionicons name="settings-outline" size={24} color="#e2e8f0" /></TouchableOpacity>
            </View>
          )
        })} />
        <Tab.Screen name="Social" component={SocialScreen} />
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="Gym" component={GymScreen} />
        <Tab.Screen name="Learning" component={LearningScreen} />
        <Tab.Screen name="Content" component={ContentScreen} />
        <Tab.Screen name="Weight" component={BodyWeightScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
      </Tab.Navigator>
  );
}

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator screenOptions={{ 
          headerStyle: { backgroundColor: '#1e293b' },
          headerTitleStyle: { color: '#fff', fontWeight: '700' },
          headerTintColor: '#fff'
      }}>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Calendar" component={CalendarScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  splashText: {
    color: '#8b5cf6',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
