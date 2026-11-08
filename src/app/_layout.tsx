import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { StoreProvider } from '../data/store';
import { Action, Body, Heading } from '../ui/components';
import { useTheme } from '../ui/theme';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const t = useTheme();
  const base = t.dark ? DarkTheme : DefaultTheme;
  return <ThemeProvider value={{ ...base, colors: { ...base.colors, background: t.background, card: t.surface, text: t.text, primary: t.accent, border: t.border } }}>
    <StatusBar style={t.dark ? 'light' : 'dark'} />
    <StoreProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project-edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
    </StoreProvider>
  </ThemeProvider>;
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.background, padding: 32, justifyContent: 'center', gap: 20 }}><Heading>Let’s try that again.</Heading><Body secondary>Muuco couldn’t display this screen. Your saved information has not been reset.</Body><Action title="Try again" onPress={retry} /></View>;
}
