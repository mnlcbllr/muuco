export type MuucoMood = 'chill' | 'focus' | 'plan' | 'celebrate' | 'victory' | 'proud' | 'confident' | 'idea' | 'overloaded' | 'analytics';

export type MoodSignals = {
  open: number;
  total: number;
  doneToday: number;
  overdue: number;
  planned: number;
  events: number;
  notes: number;
  hour: number;
};

export const moodLabels: Record<MuucoMood, string> = {
  chill: 'relaxed',
  focus: 'focused',
  plan: 'ready to plan',
  celebrate: 'celebrating',
  victory: 'celebrating a win',
  proud: 'proud of the progress',
  confident: 'confident',
  idea: 'full of ideas',
  overloaded: 'carrying a lot',
  analytics: 'on top of things',
};

export type MoodContext = MoodSignals & { nextTitle?: string };

export function moodMessage(mood: MuucoMood, { open, planned, notes, nextTitle }: MoodContext): string {
  switch (mood) {
    case 'victory': return 'Everything is done. Go enjoy the rest of your day.';
    case 'proud': return open === 0 ? 'All clear. Nice work getting here.' : 'Nice progress. Keep going.';
    case 'chill': return 'Nothing on the schedule. A clear day.';
    case 'idea': return notes === 1 ? 'A note is waiting whenever you’re ready.' : 'A few notes are waiting whenever you’re ready.';
    case 'plan': return planned > 0 ? `You have ${planned} ${planned === 1 ? 'thing' : 'things'} planned today.` : 'A little plan makes the day lighter.';
    case 'overloaded': return 'A lot on your plate. Pick one thing — the rest can wait.';
    case 'celebrate': return 'You’re making real progress. Keep the momentum.';
    case 'analytics': return 'You’re moving through the list. Keep going.';
    case 'confident': return `Good progress. ${open} ${open === 1 ? 'task' : 'tasks'} left.`;
    default: return nextTitle ? `Next up: “${nextTitle}”. One small step.` : 'Pick one thing and start small.';
  }
}

// Keep the pick deterministic and positive: celebrate work that is done,
// then acknowledge a heavy backlog before falling back to focus.
export function pickMood({ open, total, doneToday, overdue, planned, events, notes, hour }: MoodSignals): MuucoMood {
  if (open === 0) {
    if (total > 0 && doneToday > 0) return 'victory';
    if (total > 0) return 'proud';
    if (notes > 0) return 'idea';
    if (events > 0) return 'plan';
    return 'chill';
  }
  const progress = doneToday + open > 0 ? doneToday / (doneToday + open) : 0;
  if (overdue >= 3 && progress < 0.25) return 'overloaded';
  if (progress >= 0.75) return 'celebrate';
  if (progress >= 0.4) return 'proud';
  if (planned > 0 && hour < 12 && doneToday === 0) return 'plan';
  if (doneToday >= 3) return 'analytics';
  if (doneToday > 0) return 'confident';
  return 'focus';
}
