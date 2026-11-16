export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

let fallback: StorageLike | undefined;

/** localStorage when the browser allows it, otherwise memory (private windows, blocked site data). */
export function defaultStorage(): StorageLike {
  try {
    const s = window.localStorage;
    s.setItem('ap.probe', '1');
    s.removeItem('ap.probe');
    return s;
  } catch {
    return (fallback ??= memoryStorage());
  }
}
