import { useCallback, useEffect, useState } from 'react'
import { initialState } from '../data/defaults'
import { normalizeDesktopLayouts } from '../core/layout'
import type { PersistedState } from '../core/types'

const STORAGE_KEY = 'weepwood-tab-state-v2'
const LEGACY_KEY = 'weepwood-tab-state-v1'

function cloneInitialState(): PersistedState {
  return JSON.parse(JSON.stringify(initialState)) as PersistedState
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
  const [state, setState] = useState<PersistedState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
    setState(normalizeState(cloneInitialState()))
  }, [])

  return { state, setState, reset }
}
