import { router } from 'expo-router';
import { Action, Empty, Header, Screen } from '../ui/components';

export default function NotFound() {
  return <Screen><Header title="A little off track" /><Empty title="This page is not here" detail="Your tasks and notes are still in your space." /><Action title="Back to Today" onPress={() => router.replace('/')} /></Screen>;
}
