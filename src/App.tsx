import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { DesktopItem, Shortcut, WeatherSnapshot, WidgetSize, WidgetType } from './core/types'
import { workspaces } from './data/defaults'
import { useClock } from './hooks/useClock'
import { usePersistentState } from './hooks/usePersistentState'
import { SearchBar } from './components/SearchBar'
import { SideRail } from './components/SideRail'
import { BottomDock } from './components/BottomDock'
import { DesktopCanvas } from './components/DesktopCanvas'
import { AddPanel } from './components/AddPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { Icon } from './components/Icon'
import './styles/app.css'

const wallpaperMap = {
  meadow: './wallpapers/meadow.svg',
  mist: './wallpapers/mist.svg',
  sunset: './wallpapers/sunset.svg',
  aurora: './wallpapers/aurora.svg',
} as const

export default function App() {
  const { state, setState, reset } = usePersistentState()
  const { now, time, date } = useClock(state.settings.showSeconds)
  const [editMode, setEditMode] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<'general' | 'wallpaper' | null>(null)

  const currentWorkspace = workspaces.find((workspace) => workspace.id === state.activeWorkspace) ?? workspaces[0]!
  const workspaceItems = useMemo(
    () => state.desktopItems.filter((item) => item.workspaceId === state.activeWorkspace),
    [state.desktopItems, state.activeWorkspace],
  )

  const wallpaper = state.settings.wallpaper === 'custom'
    ? state.settings.customWallpaper
    : wallpaperMap[state.settings.wallpaper]

  const reorder = (sourceId: string, targetId: string) => {
    setState((current) => {
      const sourceIndex = current.desktopItems.findIndex((item) => item.id === sourceId)
      const targetIndex = current.desktopItems.findIndex((item) => item.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const next = [...current.desktopItems]
      const [moved] = next.splice(sourceIndex, 1)
      if (!moved) return current
      next.splice(targetIndex, 0, moved)
      return { ...current, desktopItems: next }
    })
  }

  const removeItem = (item: DesktopItem) => {
    setState((current) => ({
      ...current,
      desktopItems: current.desktopItems.filter((entry) => entry.id !== item.id),
      widgets: item.kind === 'widget' ? current.widgets.filter((widget) => widget.id !== item.refId) : current.widgets,
    }))
  }

  const addShortcut = (shortcut: Shortcut) => {
    setState((current) => ({
      ...current,
      shortcuts: [...current.shortcuts, shortcut],
      desktopItems: [...current.desktopItems, {
        id: `di-${shortcut.id}`,
        workspaceId: shortcut.workspaceId,
        kind: 'shortcut',
        refId: shortcut.id,
      }],
    }))
  }

  const addWidget = (type: WidgetType, size: WidgetSize) => {
    const id = crypto.randomUUID()
    setState((current) => ({
      ...current,
      widgets: [...current.widgets, { id, workspaceId: current.activeWorkspace, type, size }],
      desktopItems: [...current.desktopItems, {
        id: `di-${id}`,
        workspaceId: current.activeWorkspace,
        kind: 'widget',
        refId: id,
      }],
    }))
  }

  const updateWeather = (weather: WeatherSnapshot) => setState((current) => ({ ...current, weather }))

  return (
    <div
      className={`app-shell theme-${state.settings.theme} ${state.settings.glass ? 'glass-on' : 'glass-off'} ${editMode ? 'edit-mode' : ''}`}
      style={{
        '--wallpaper-image': wallpaper ? `url("${wallpaper}")` : 'none',
        '--wallpaper-blur': `${state.settings.wallpaperBlur}px`,
        '--wallpaper-shade': `${state.settings.wallpaperShade / 100}`,
      } as CSSProperties}
    >
      <div className="wallpaper-layer" />
      <div className="wallpaper-overlay" />

      <SideRail
        visible={state.settings.showLeftRail}
        editMode={editMode}
        workspaces={workspaces}
        activeWorkspace={state.activeWorkspace}
        onWorkspaceChange={(activeWorkspace) => setState((current) => ({ ...current, activeWorkspace }))}
        onAdd={() => setAddOpen(true)}
        onWallpaper={() => setSettingsSection('wallpaper')}
        onSettings={() => setSettingsSection('general')}
        onEdit={() => setEditMode((value) => !value)}
      />

      <header className="desktop-topbar">
        <div className="workspace-status">
          <span>{currentWorkspace.icon}</span>
          <div><strong>{currentWorkspace.name}</strong><small>{currentWorkspace.hint}</small></div>
        </div>
        <SearchBar
          shortcuts={state.shortcuts}
          engine={state.settings.searchEngine}
          showSuggestions={state.settings.showSearchSuggestions}
          onEngineChange={(searchEngine) => setState((current) => ({ ...current, settings: { ...current.settings, searchEngine } }))}
        />
        <div className="time-status"><strong>{time}</strong><small>{date}</small></div>
      </header>

      <main className={`desktop-stage ${state.settings.showLeftRail ? 'with-rail' : ''}`}>
        <DesktopCanvas
          workspaceId={state.activeWorkspace}
          items={workspaceItems}
          shortcuts={state.shortcuts}
          folders={state.folders}
          widgets={state.widgets}
          tasks={state.tasks}
          notes={state.notes[state.activeWorkspace]}
          weather={state.weather}
          now={now}
          editMode={editMode}
          iconShape={state.settings.iconShape}
          onReorder={reorder}
          onRemoveItem={removeItem}
          onTasksChange={(tasks) => setState((current) => ({ ...current, tasks }))}
          onNotesChange={(value) => setState((current) => ({ ...current, notes: { ...current.notes, [current.activeWorkspace]: value } }))}
          onWeatherChange={updateWeather}
          onAdd={() => setAddOpen(true)}
        />
      </main>

      {editMode && (
        <button className="edit-finish" onClick={() => setEditMode(false)}><Icon name="check" />完成编辑</button>
      )}

      <BottomDock
        visible={state.settings.showDock}
        magnify={state.settings.dockMagnify}
        shortcuts={state.shortcuts}
        shortcutIds={state.dockShortcutIds}
        iconShape={state.settings.iconShape}
        onAdd={() => setAddOpen(true)}
      />

      <AddPanel
        open={addOpen}
        workspaceId={state.activeWorkspace}
        onClose={() => setAddOpen(false)}
        onAddShortcut={addShortcut}
        onAddWidget={addWidget}
      />

      {settingsSection && (
        <SettingsPanel
          open
          initialSection={settingsSection}
          settings={state.settings}
          state={state}
          onChange={(settings) => setState((current) => ({ ...current, settings }))}
          onImport={(imported) => setState(imported)}
          onReset={() => { reset(); setSettingsSection(null) }}
          onClose={() => setSettingsSection(null)}
        />
      )}
    </div>
  )
}
