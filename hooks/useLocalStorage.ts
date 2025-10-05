import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Start with the value from localStorage synchronously for immediate UI render
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // When available, prefer loading authoritative data from main process via electronAPI
  useEffect(() => {
    let mounted = true;
    const trySyncFromMain = async () => {
      try {
        const api = (window as any).electronAPI;
        if (api && typeof api.getItem === 'function') {
          const res = await api.getItem(key);
          if (res && res.ok) {
            // Only update if main has a value (undefined means not present)
            if (res.value !== undefined && mounted) {
              setStoredValue(res.value);
              // Mirror to localStorage for quick subsequent reads
              try { window.localStorage.setItem(key, JSON.stringify(res.value)); } catch {}
              return;
            }
          }
        }
        // Fallback: ensure localStorage value is reflected
        try {
          const item = window.localStorage.getItem(key);
          if (item && mounted) setStoredValue(JSON.parse(item));
        } catch (e) {
          console.error('Error reading from local storage', e);
        }
      } catch (err) {
        console.error('Error syncing from main process', err);
      }
    };
    trySyncFromMain();
    return () => { mounted = false; };
  }, [key]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (value) => {
      try {
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;
          // Mirror to localStorage synchronously
          try { window.localStorage.setItem(key, JSON.stringify(valueToStore)); } catch (e) { console.error(e); }

          // Fire-and-forget to main process when available
          try {
            const api = (window as any).electronAPI;
            if (api && typeof api.setItem === 'function') {
              // Don't await; best-effort persistence to main
              api.setItem(key, valueToStore).catch?.(() => {});
            }
          } catch (e) {
            // ignore
          }

          return valueToStore;
        });
      } catch (error) {
        console.error(error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

export default useLocalStorage;
