export type WorkspaceId = 'focus' | 'work' | 'study' | 'life'
export type ThemeId = 'midnight' | 'aurora' | 'paper'
export type WallpaperId = 'mist' | 'meadow' | 'sunset' | 'aurora' | 'custom'
export type SearchEngineId = 'bing' | 'google' | 'baidu' | 'duckduckgo'
export type IconShape = 'squircle' | 'rounded' | 'circle'
export type ShortcutIconMode = 'auto' | 'text'
export type WidgetType = 'weather' | 'calendar' | 'countdown' | 'tasks' | 'notes' | 'clock'
export type WidgetSize = 'small' | 'medium' | 'wide' | 'tall'

export interface Workspace {
  id: WorkspaceId
  name: string
  hint: string
  icon: string
}

export interface Shortcut {
  id: string
  workspaceId: WorkspaceId
  title: string
  url: string
  icon: string
  color: string
  iconMode?: ShortcutIconMode
  iconUrl?: string
}

export interface Folder {
  id: string
  workspaceId: WorkspaceId
  title: string
  shortcutIds: string[]
}

export interface WidgetInstance {
  id: string
  workspaceId: WorkspaceId
  type: WidgetType
  size: WidgetSize
  title?: string
  config?: Record<string, string | number | boolean>
}

export interface DesktopItem {
  id: string
  workspaceId: WorkspaceId
  kind: 'shortcut' | 'folder' | 'widget'
  refId: string
}

export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: number
}

export interface AppSettings {
  theme: ThemeId
  glass: boolean
  showSeconds: boolean
  compactShortcuts: boolean
  wallpaper: WallpaperId
  customWallpaper?: string
  wallpaperBlur: number
  wallpaperShade: number
  showLeftRail: boolean
  showDock: boolean
  iconShape: IconShape
  searchEngine: SearchEngineId
  showSearchSuggestions: boolean
  dockMagnify: boolean
}

export interface WeatherSnapshot {
  temperature: number
  code: number
  location: string
  updatedAt: number
}

export interface PersistedState {
  version: 2
  activeWorkspace: WorkspaceId
  shortcuts: Shortcut[]
  folders: Folder[]
  widgets: WidgetInstance[]
  desktopItems: DesktopItem[]
  dockShortcutIds: string[]
  tasks: Task[]
  notes: Record<WorkspaceId, string>
  weather?: WeatherSnapshot
  settings: AppSettings
}
