import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { initialState } from '../data/defaults'
import { normalizeDesktopLayouts } from '../core/layout'
import type { PersistedState } from '../core/types'

const STORAGE_KEY = 'weepwood-tab-state-v2'
const LEGACY_KEY = 'weepwood-tab-state-v1'
const HISTORY_LIMIT = 50

interface HistoryState {
  past: PersistedState[]
  present: PersistedState
  future: PersistedState[]
}

function cloneState(state: PersistedState): PersistedState {
  return JSON.parse(JSON.stringify(state)) as PersistedState
}

function cloneInitialState(): PersistedState {
  return cloneState(initialState)
}

function normalizeState(value: unknown): PersistedState {
  const fallback = cloneInitialState()
  if (!value || typeof value !== 'object') {
    return { ...fallback, desktopItems: normalizeDesktopLayouts(fallback.desktopItems, fallback.widgets) }
  }

  const parsed = value as Partial<PersistedState>
  const widgets = Array.isArray(parsed.widgets) ? parsed.widgets : fallback.widgets
  const desktopItems = Array.isArray(parsed.desktopItems) ? parsed.desktopItems : fallback.desktopItems

  return {
    ...fallback,
    ...parsed,
    version: 2,
    shortcuts: Array.isArray(parsed.shortcuts) ? parsed.shortcuts : fallback.shortcuts,
    folders: Array.isArray(parsed.folders) ? parsed.folders : fallback.folders,
    widgets,
    desktopItems: normalizeDesktopLayouts(desktopItems, widgets),
    dockShortcutIds: Array.isArray(parsed.dockShortcutIds) ? parsed.dockShortcutIds : fallback.dockShortcutIds,
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fallback.tasks,
    notes: { ...fallback.notes, ...(parsed.notes ?? {}) },
    settings: { ...fallback.settings, ...(parsed.settings ?? {}) },
  }
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) return normalizeState(cloneInitialState())
    return normalizeState(JSON.parse(raw))
  } catch {
    return normalizeState(cloneInitialState())
  }
}

export function usePersistentState() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: loadState(),
    future: [],
  }))

  const state = history.present

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setState = useCallback<Dispatch<SetStateAction<PersistedState>>>((action) => {
    setHistory((current) => {
      const next = typeof action === 'function'
        ? (action as (value: PersistedState) => PersistedState)(current.present)
        : action
      if (next === current.present) return current
      return {
        past: [...current.past, cloneState(current.present)].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
      }
    })
  }, [])

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1)
      if (!previous) return current
      return {
        past: current.past.slice(0, -1),
        present: cloneState(previous),
        future: [cloneState(current.present), ...current.future].slice(0, HISTORY_LIMIT),
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0]
      if (!next) return current
      return {
        past: [...current.past, cloneState(current.present)].slice(-HISTORY_LIMIT),
        present: cloneState(next),
        future: current.future.slice(1),
      }
    })
  }, [])

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, [contenteditable="true"]')) return
      const modifier = event.ctrlKey || event.metaKey
      if (!modifier || event.key.toLowerCase() !== 'z') return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [redo, undo])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
    setHistory((current) => ({
      past: [...current.past, cloneState(current.present)].slice(-HISTORY_LIMIT),
      present: normalizeState(cloneInitialState()),
      future: [],
    }))
  }, [])

  return {
    state,
    setState,
    reset,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
