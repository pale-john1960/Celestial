// Celestial — all built-in event rule datasets
import type { EventRule } from '../types';
import { internationalRules } from './international';
import { usRules } from './us';
import { jpRules } from './jp';
import { persianCulturalRules } from './persian-cultural';
import { persianNationalRules } from './persian-national';
import { persianReligiousRules } from './persian-religious';

export const allBuiltinRules: EventRule[] = [
  ...internationalRules,
  ...usRules,
  ...jpRules,
  ...persianCulturalRules,
  ...persianNationalRules,
  ...persianReligiousRules,
];

export { internationalRules, usRules, jpRules, persianCulturalRules, persianNationalRules, persianReligiousRules };
