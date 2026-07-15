export function storeData(key: string, data: Record<string, unknown>) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadData<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
