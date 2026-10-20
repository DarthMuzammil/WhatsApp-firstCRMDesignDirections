import { useEffect, useState } from 'react'

// All demo state is saved in localStorage under this prefix so it survives a
// page refresh. Bump the version whenever a stored shape changes.
const STORAGE_PREFIX = 'daira:v13:'

/** useState that persists to localStorage. Falls back to `initialValue` if storage is unavailable or corrupt. */
export function useLocalState<T>(key: string, initialValue: T) {
  const storageKey = STORAGE_PREFIX + key
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as T) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Storage full or blocked (private mode). The demo still works in memory.
    }
  }, [storageKey, value])
  return [value, setValue] as const
}

/** Removes every saved demo value, including older versions. The caller should reload the page afterwards. */
export function clearDemoStorage() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('daira:') || key.startsWith('daira-'))
      .forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Nothing to clear.
  }
}
