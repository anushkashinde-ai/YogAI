import { useEffect, useState } from 'react'

/**
 * Debounces a rapidly changing value — used for the pose search box so we do
 * not fire a request on every keystroke.
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
