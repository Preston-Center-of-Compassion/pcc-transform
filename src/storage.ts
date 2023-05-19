export function storeData(key: string, data: Record<string, any>) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadData<T>(key: string) {
  if (localStorage.getItem(key)) {
    return JSON.parse(localStorage.getItem(key)) as T;
  } else {
    null;
  }
}
