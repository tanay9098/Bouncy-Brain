import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '../contexts/UserContext';
import { colors } from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import FocusScreen from '../screens/FocusScreen';
import DeadlinesScreen from '../screens/DeadlinesScreen';
import StatsScreen from '../screens/StatsScreen';
import MoreScreen from '../screens/MoreScreen';

export type AuthStackParams = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParams = {
  Home: undefined;
  Tasks: undefined;
  Focus: undefined;
  Deadlines: undefined;
  Stats: undefined;
  More: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const MainTab = createBottomTabNavigator<MainTabParams>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: colors.violetLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Tasks: ['checkmark-circle', 'checkmark-circle-outline'],
            Focus: ['timer', 'timer-outline'],
            Deadlines: ['alarm', 'alarm-outline'],
            Stats: ['bar-chart', 'bar-chart-outline'],
            More: ['grid', 'grid-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <Ionicons
              name={(focused ? active : inactive) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Tasks" component={TasksScreen} />
      <MainTab.Screen name="Focus" component={FocusScreen} />
      <MainTab.Screen name="Deadlines" component={DeadlinesScreen} />
      <MainTab.Screen name="Stats" component={StatsScreen} />
      <MainTab.Screen name="More" component={MoreScreen} />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.violetLight} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.violetLight,
          background: colors.bg,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.violet,
        },
      }}
    >
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
