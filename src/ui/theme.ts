import { useColorScheme } from 'react-native';

const light = {
  background: '#F5F4F8', surface: '#FFFFFF', inset: '#EFEDF3', text: '#24212B', secondary: '#726D7E',
  accent: '#7054A3', accentSoft: '#ECE6F5', accentText: '#62458F', border: '#E8E5ED',
  gold: '#F4BC3F', goldSoft: '#FFF3D7', success: '#367A60', danger: '#A74739', white: '#FFFFFF', dark: false,
};
type Theme = { [K in keyof typeof light]: (typeof light)[K] extends boolean ? boolean : string };
const dark: Theme = {
  background: '#151318', surface: '#211E26', inset: '#2A2630', text: '#F6F2FA', secondary: '#B1AABB',
  accent: '#BDA3E8', accentSoft: '#332840', accentText: '#D0BBF0', border: '#39323F',
  gold: '#F4C45C', goldSoft: '#3A3020', success: '#91C8AA', danger: '#EEA294', white: '#FFFFFF', dark: true,
};
export function useTheme(): Theme { return useColorScheme() === 'dark' ? dark : light; }
