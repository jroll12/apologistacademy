import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../store/storage';
import { DAILY_LIMIT, canStart, dayKey, formatReset, nextReset, recordStart, used } from './dailyLimit';

describe('daily limit', () => {
  const noon = new Date(2026, 10, 5, 12, 0);

  it('blocks new conversations once the limit is reached', () => {
    const storage = memoryStorage();
    for (let i = 0; i < DAILY_LIMIT; i++) {
      expect(canStart(storage, noon)).toBe(true);
      recordStart(storage, noon);
    }
    expect(used(storage, noon)).toBe(DAILY_LIMIT);
    expect(canStart(storage, noon)).toBe(false);
  });

  it('resets on the next local day', () => {
    const storage = memoryStorage();
    for (let i = 0; i < DAILY_LIMIT; i++) recordStart(storage, noon);
    const justAfterMidnight = new Date(2026, 10, 6, 0, 1);
    expect(dayKey(justAfterMidnight)).not.toBe(dayKey(noon));
    expect(canStart(storage, justAfterMidnight)).toBe(true);
  });

  it('does not reset one minute before midnight', () => {
    const storage = memoryStorage();
    for (let i = 0; i < DAILY_LIMIT; i++) recordStart(storage, noon);
    expect(canStart(storage, new Date(2026, 10, 5, 23, 59))).toBe(false);
  });

  it('computes the next local midnight', () => {
    const reset = nextReset(noon);
    expect([reset.getDate(), reset.getHours(), reset.getMinutes()]).toEqual([6, 0, 0]);
    expect(formatReset(noon)).toMatch(/12:00|0:00|00:00/);
  });

  it('rolls over at the end of a month', () => {
    const reset = nextReset(new Date(2026, 10, 30, 22, 0));
    expect([reset.getMonth(), reset.getDate()]).toEqual([11, 1]);
  });

  it('survives corrupt storage', () => {
    const storage = memoryStorage();
    storage.setItem('ap.practice.daily', '{nope');
    expect(canStart(storage, noon)).toBe(true);
    storage.setItem('ap.practice.daily', JSON.stringify({ day: dayKey(noon), count: 'many' }));
    expect(used(storage, noon)).toBe(0);
  });

  it('does not throw when storage refuses writes', () => {
    const blocked = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => recordStart(blocked, noon)).not.toThrow();
  });
});
