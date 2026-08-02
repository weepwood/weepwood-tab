export type WorkspaceId = 'focus' | 'work' | 'study' | 'life'
export type ThemeId = 'midnight' | 'aurora' | 'paper'

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
}

export interface PersistedState {
  activeWorkspace: WorkspaceId
  shortcuts: Shortcut[]
  tasks: Task[]
  notes: Record<WorkspaceId, string>
  settings: AppSettings
}
