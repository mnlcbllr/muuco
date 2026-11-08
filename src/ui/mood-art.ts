import type { ImageSourcePropType } from 'react-native';
import type { MuucoMood } from './mood';

export const moodArt: Record<MuucoMood, ImageSourcePropType> = {
  confident: require('../../assets/brand/moods/confident.png'),
  focus: require('../../assets/brand/moods/focus.png'),
  celebrate: require('../../assets/brand/moods/celebrate.png'),
  plan: require('../../assets/brand/moods/plan.png'),
  chill: require('../../assets/brand/moods/chill.png'),
  proud: require('../../assets/brand/moods/proud.png'),
  idea: require('../../assets/brand/moods/idea.png'),
  analytics: require('../../assets/brand/moods/analytics.png'),
  overloaded: require('../../assets/brand/moods/overloaded.png'),
  victory: require('../../assets/brand/moods/victory.png'),
};
