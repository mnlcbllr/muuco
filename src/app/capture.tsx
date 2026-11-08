import { Redirect } from 'expo-router';

// Keep old capture links working after the inbox was removed.
export default function CaptureRedirect() {
  return <Redirect href={{ pathname: '/edit', params: { kind: 'note' } }} />;
}
