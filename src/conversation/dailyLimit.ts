export const DAILY_LIMIT = 3;
const KEY = 'ap.practice.daily';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const memory = (): StorageLike => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
};

let fallback: StorageLike | undefined;
export function defaultStorage(): StorageLike {
  try {
    const s = window.localStorage;
    s.setItem('ap.probe', '1');
    return s;
  } catch {
    return (fallback ??= memory());
  }
}

/** Local calendar day, so the limit resets at the user's midnight. */
export function dayKey(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function used(storage: StorageLike, now: Date): number {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return 0;
    const v = JSON.parse(raw) as { day: string; count: number };
    return v.day === dayKey(now) && Number.isFinite(v.count) ? v.count : 0;
  } catch {
    return 0;
  }
}

/** Checked only when a NEW conversation starts. Never call this mid-conversation. */
export function canStart(storage: StorageLike, now: Date, limit = DAILY_LIMIT): boolean {
  return used(storage, now) < limit;
}

export function recordStart(storage: StorageLike, now: Date): void {
  storage.setItem(KEY, JSON.stringify({ day: dayKey(now), count: used(storage, now) + 1 }));
}

export function nextReset(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

export function formatReset(now: Date): string {
  return nextReset(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
