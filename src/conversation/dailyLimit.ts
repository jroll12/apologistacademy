import type { StorageLike } from '../store/storage';

/** New conversations a person can begin per local day. Change it here. */
export const DAILY_LIMIT = 3;
const KEY = 'ap.practice.daily';

/** Local calendar day, so the limit resets at the person's own midnight. */
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

/** Checked only when a NEW conversation is about to start. Never call this mid-conversation. */
export function canStart(storage: StorageLike, now: Date, limit = DAILY_LIMIT): boolean {
  return used(storage, now) < limit;
}

/** Called when the person sends their first reply, so opening a question and backing out is free. */
export function recordStart(storage: StorageLike, now: Date): void {
  try {
    storage.setItem(KEY, JSON.stringify({ day: dayKey(now), count: used(storage, now) + 1 }));
  } catch {
    // Storage blocked: the limit simply does not apply on this device.
  }
}

export function nextReset(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

export function formatReset(now: Date): string {
  return nextReset(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
