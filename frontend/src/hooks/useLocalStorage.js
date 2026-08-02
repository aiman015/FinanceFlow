import { useEffect, useRef, useState } from 'react'

/**
 * A localStorage-backed useState that never lets bad data crash the app.
 *
 * - If the stored value is missing, it falls back to `initialValue`.
 * - If the stored value is not valid JSON ("corrupted"), it falls back to
 *   `initialValue` instead of throwing.
 * - If an optional `validate(parsedValue)` function is given and it returns
 *   false, the parsed value is treated as corrupted too (e.g. transactions
 *   somehow stored as an object instead of an array) and defaults are used.
 * - Write failures (e.g. quota exceeded, private-browsing restrictions) are
 *   caught and reported via `error` instead of crashing the app.
 *
 * Returns [value, setValue, { corrupted, error }] — the third item is
 * optional to consume, so existing `const [x, setX] = useLocalStorage(...)`
 * call sites keep working unchanged.
 */
export function useLocalStorage(key, initialValue, validate) {
  const wasCorrupted = useRef(false)
  const [error, setError] = useState(null)

  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored === null) return initialValue

      const parsed = JSON.parse(stored)

      if (typeof validate === 'function' && !validate(parsed)) {
        wasCorrupted.current = true
        return initialValue
      }

      return parsed
    } catch {
      // JSON.parse failed, or localStorage itself is unavailable — the data
      // is corrupted or unreachable, so restore the safe default instead of
      // letting the app crash on startup.
      wasCorrupted.current = true
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      if (error) setError(null)
    } catch (e) {
      // storage unavailable (e.g. private browsing quota) — fail safely and
      // surface it so the caller can inform the user rather than silently
      // losing their changes.
      setError(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value])

  return [value, setValue, { corrupted: wasCorrupted.current, error }]
}
