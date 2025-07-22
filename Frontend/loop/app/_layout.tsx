import '~/global.css';
import { Theme, ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Redirect, Stack, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Platform, View } from 'react-native';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { PortalHost } from '@rn-primitives/portal';
import {TimerProvider} from "~/app/Timer";
import AppTimerDisplay from "~/components/AppTimer";
import { useSegments } from 'expo-router';

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const hasMounted = React.useRef(false);
  const { colorScheme, isDarkColorScheme, setColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
    const segments = useSegments();
    const inTabs = segments[0] === '(tabs)';

    useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === 'web') {
      // Adds the background color to the html element to prevent white background on overscroll.
      document.documentElement.classList.add('bg-background');
    }
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }
  // Screen Displays
  return (
      <TimerProvider>
        <View className="flex-1 bg-background dark:bg-background">
          <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
            <StatusBar style-={isDarkColorScheme ? 'light' : 'dark'} />
            <Stack initialRouteName="index">
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="loginOrRegister" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
              <Stack.Screen name="profileSetup" options={{ headerShown: false }} />
              <Stack.Screen name="createCommunity" options={{ title: 'Create Community' }} />
              <Stack.Screen name="communities" options={{ title: 'Communities' }} />
              <Stack.Screen name="events" options={{ title: 'Events' }} />
              <Stack.Screen name="createEvent" options={{ title: 'Create Event' }} />
              <Stack.Screen name="createAnnouncement" options={{ title: 'Create Announcement' }} />
              <Stack.Screen name="message" options={{ title: 'Messages' }} />
              <Stack.Screen name="newChat" options={{ title: 'New Chat' }} />
              <Stack.Screen name="createGroupChat" options={{ title: 'Create Group Chat' }} />
              <Stack.Screen name="chat" options={{ headerShown: false, title: 'Chat' }} />
              <Stack.Screen name="communityChat" options={{ headerShown: false, title: 'Community Chat' }}/>
            </Stack>
          </ThemeProvider>
            {inTabs && <AppTimerDisplay />}
          <PortalHost />
        </View>
      </TimerProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === 'web' && typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
