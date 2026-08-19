// =============================================================================
// PROJECT JULIE — TIME-BASED DYNAMIC GREETING UTILITY
// Dynamically calculates morning, afternoon, evening, and late-night greetings
// =============================================================================

export interface TimeGreeting {
  greeting: string;
  emoji: string;
  subtitle: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
}

export function getTimeBasedGreeting(title: string = 'boss'): TimeGreeting {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good morning, ${title}!`,
      emoji: '👋',
      subtitle: 'How can I help you today?',
      period: 'morning',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon, ${title}!`,
      emoji: '☀️',
      subtitle: 'How is your afternoon progressing?',
      period: 'afternoon',
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      greeting: `Good evening, ${title}!`,
      emoji: '🌆',
      subtitle: 'Wrapping up lectures or focusing on projects?',
      period: 'evening',
    };
  } else {
    return {
      greeting: `Working late, ${title}?`,
      emoji: '🌙',
      subtitle: 'I am active and ready for your late-night session.',
      period: 'night',
    };
  }
}
