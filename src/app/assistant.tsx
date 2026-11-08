import { Redirect } from 'expo-router';

// The non-functional assistant screen was removed. Old links return home.
export default function AssistantRedirect() {
  return <Redirect href="/" />;
}
