/**
 * Root Navigation
 * 
 * Handles the main navigation structure:
 * - Splash (session restore)
 * - Auth (login, company selection)
 * - Main (authenticated tabs)
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import LoginScreen from '../screens/auth/LoginScreen';
import CompanySelectionScreen from '../screens/auth/CompanySelectionScreen';
import MainTabNavigator from './MainTabNavigator';
import { LightTheme, DarkTheme } from '../theme';
import { useColorScheme } from 'react-native';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, companies, activeCompany, restoreSession } = useAuth();
  const [isRestoring, setIsRestoring] = useState(true);
  const colorScheme = useColorScheme();

  // Enable session timeout monitoring
  useSessionTimeout();

  // Try to restore session on mount
  useEffect(() => {
    const init = async () => {
      await restoreSession();
      setIsRestoring(false);
    };
    init();
  }, []);

  // Show splash while restoring session
  if (isRestoring || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : LightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animationTypeForReplace: 'pop' }}
            />
            <Stack.Screen
              name="CompanySelection"
              component={CompanySelectionScreen}
            />
          </>
        ) : !activeCompany && companies.length > 0 ? (
          <Stack.Screen
            name="CompanySelection"
            component={CompanySelectionScreen}
          />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
