export function storeData(key: string, data: Record<string, unknown>) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadData<T>(key: string) {
  if (localStorage.getItem(key)) {
    return JSON.parse(localStorage.getItem(key)) as T;
  } 
  return null;
}
