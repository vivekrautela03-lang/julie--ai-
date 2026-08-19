import { describe, it, expect } from 'vitest';
import { ProactiveEngine } from '../services/proactive/ProactiveEngine';

describe('ProactiveEngine (Greetings, Rules, Notification Suppressions)', () => {
  it('generates dynamic greetings based on hour', () => {
    expect(ProactiveEngine.getDynamicGreeting('Boss', 8)).toBe('Good morning, Boss.');
    expect(ProactiveEngine.getDynamicGreeting('Boss', 14)).toBe('Good afternoon, Boss.');
    expect(ProactiveEngine.getDynamicGreeting('Boss', 19)).toBe('Good evening, Boss.');
    expect(ProactiveEngine.getDynamicGreeting('Boss', 23)).toBe('Still working, Boss?');
    expect(ProactiveEngine.getDynamicGreeting('Shaurya', 9)).toBe('Good morning, Shaurya.');
  });

  it('evaluates quiet hours suppression correctly', () => {
    // Normal urgency during quiet hours should be suppressed
    // Urgent urgency bypasses quiet hours
    const shouldDispatchUrgent = ProactiveEngine.shouldDispatchNotification({
      urgency: 'Urgent',
      quietHoursEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
    });
    expect(shouldDispatchUrgent).toBe(true);

    const shouldDispatchDisabled = ProactiveEngine.shouldDispatchNotification({
      urgency: 'Normal',
      quietHoursEnabled: false,
    });
    expect(shouldDispatchDisabled).toBe(true);
  });
});
