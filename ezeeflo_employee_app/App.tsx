/**
 * EzeeFlo Employee Self-Service App
 * 
 * Main application entry point.
 * Wraps the app with required providers.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { LightTheme, DarkTheme } from './src/theme';
import { useSessionTimeout } from './src/hooks/useSessionTimeout';

const AppContent: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

const App: React.FC = () => {
  return (
    <ReduxProvider store={store}>
      <AppContent />
    </ReduxProvider>
  );
};

export default App;
