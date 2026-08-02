import { useCallback, useEffect, useState } from 'react'
import { initialState } from '../data/defaults'
import type { PersistedState } from '../core/types'

const STORAGE_KEY = 'weepwood-tab-state-v1'

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      ...initialState,
      ...parsed,
      notes: { ...initialState.notes, ...parsed.notes },
      settings: { ...initialState.settings, ...parsed.settings },
    }
  } catch {
    return initialState
  }
}

export function usePersistentState() {
  const [state, setState] = useState<PersistedState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(initialState)
  }, [])

  return { state, setState, reset }
}
