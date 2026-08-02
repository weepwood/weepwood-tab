import type { PersistedState, WorkspaceAppearance, WorkspaceId } from './types'

const APPEARANCE_KEY = 'weepwood-tab-appearance-v1'
export const APPEARANCE_EVENT = 'weepwood-tab-appearance-change'

const wallpaperMap = {
  meadow: './wallpapers/meadow.svg',
  mist: './wallpapers/mist.svg',
  sunset: './wallpapers/sunset.svg',
  aurora: './wallpapers/aurora.svg',
} as const

interface AppearanceSnapshot {
  global: WorkspaceAppearance
  workspaces?: Partial<Record<WorkspaceId, WorkspaceAppearance>>
}

function toCssUrl(value?: string) {
  if (!value) return 'none'
  return `url("${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}")`
}

function resolveWallpaper(appearance: WorkspaceAppearance) {
  if (appearance.wallpaper === 'custom') return appearance.customWallpaper
  return wallpaperMap[appearance.wallpaper]
}

function buildSnapshot(state: PersistedState): AppearanceSnapshot {
  return {
    global: {
      wallpaper: state.settings.wallpaper,
      customWallpaper: state.settings.customWallpaper,
      wallpaperBlur: state.settings.wallpaperBlur,
      wallpaperShade: state.settings.wallpaperShade,
    },
    workspaces: state.workspaceAppearances,
  }
}

export function saveAppearanceSnapshot(state: PersistedState) {
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(buildSnapshot(state)))
    window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT))
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
}

function readSnapshot(): AppearanceSnapshot | null {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppearanceSnapshot
    return parsed?.global ? parsed : null
  } catch {
    return null
  }
}

export function applyWorkspaceAppearance(workspaceId: WorkspaceId) {
  const shell = document.querySelector<HTMLElement>('.app-shell')
  const snapshot = readSnapshot()
  if (!shell || !snapshot) return

  const appearance = snapshot.workspaces?.[workspaceId] ?? snapshot.global
  shell.style.setProperty('--wallpaper-image', toCssUrl(resolveWallpaper(appearance)))
  shell.style.setProperty('--wallpaper-blur', `${appearance.wallpaperBlur}px`)
  shell.style.setProperty('--wallpaper-shade', `${appearance.wallpaperShade / 100}`)
}
