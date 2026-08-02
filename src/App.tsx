import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { DesktopItem, DesktopLayout, Folder, Shortcut, WeatherSnapshot, WidgetInstance, WidgetSize, WidgetType } from './core/types'
import {
  findNearestFreeLayout,
  getNextDesktopLayout,
  getWidgetDimensions,
  widgetSizeFromLayout,
} from './core/layout'
import { workspaces } from './data/defaults'
import { useClock } from './hooks/useClock'
import { usePersistentState } from './hooks/usePersistentState'
import { SearchBar } from './components/SearchBar'
import { SideRail } from './components/SideRail'
import { BottomDock } from './components/BottomDock'
import { DesktopCanvas } from './components/DesktopCanvas'
import { AddPanel } from './components/AddPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { DesktopContextMenu, FolderEditor, ShortcutEditor } from './components/DesktopActions'
import type { ContextTarget } from './components/DesktopActions'
import { Icon } from './components/Icon'
import './styles/app.css'
import './styles/interaction-enhancements.css'

const wallpaperMap = {
  meadow: './wallpapers/meadow.svg',
  mist: './wallpapers/mist.svg',
  sunset: './wallpapers/sunset.svg',
  aurora: './wallpapers/aurora.svg',
} as const

const sizeOrder: WidgetSize[] = ['small', 'medium', 'wide', 'tall']

function defaultWidgetConfig(type: WidgetType): Record<string, string | number | boolean> | undefined {
  if (type !== 'anniversary') return undefined
  const date = new Date(new Date().getFullYear() + 1, 0, 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return { title: '重要日期', date: `${year}-${month}-${day}` }
}

export default function App() {
  const { state, setState, reset, undo, redo, canUndo, canRedo } = usePersistentState()
  const { now, time, date } = useClock(state.settings.showSeconds)
  const [editMode, setEditMode] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<'general' | 'wallpaper' | null>(null)
  const [contextTarget, setContextTarget] = useState<ContextTarget | null>(null)
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)

  const currentWorkspace = workspaces.find((workspace) => workspace.id === state.activeWorkspace) ?? workspaces[0]!
  const workspaceItems = useMemo(
    () => state.desktopItems.filter((item) => item.workspaceId === state.activeWorkspace),
    [state.desktopItems, state.activeWorkspace],
  )

  const wallpaper = state.settings.wallpaper === 'custom'
    ? state.settings.customWallpaper
    : wallpaperMap[state.settings.wallpaper]

  const contextShortcut = contextTarget?.item.kind === 'shortcut'
    ? state.shortcuts.find((shortcut) => shortcut.id === contextTarget.item.refId)
    : undefined
  const contextFolder = contextTarget?.item.kind === 'folder'
    ? state.folders.find((folder) => folder.id === contextTarget.item.refId)
    : undefined
  const contextWidget = contextTarget?.item.kind === 'widget'
    ? state.widgets.find((widget) => widget.id === contextTarget.item.refId)
    : undefined
  const editingShortcut = state.shortcuts.find((shortcut) => shortcut.id === editingShortcutId)
  const editingFolder = state.folders.find((folder) => folder.id === editingFolderId)

  const mergeItems = (sourceId: string, targetId: string) => {
    setState((current) => {
      const source = current.desktopItems.find((item) => item.id === sourceId)
      const target = current.desktopItems.find((item) => item.id === targetId)
      if (!source || !target || source.locked || target.locked || source.id === target.id || source.workspaceId !== target.workspaceId) return current

      if (source.kind === 'shortcut' && target.kind === 'shortcut') {
        const sourceShortcut = current.shortcuts.find((shortcut) => shortcut.id === source.refId)
        const targetShortcut = current.shortcuts.find((shortcut) => shortcut.id === target.refId)
        if (!sourceShortcut || !targetShortcut) return current

        const folderId = crypto.randomUUID()
        const folder: Folder = {
          id: folderId,
          workspaceId: source.workspaceId,
          title: '新建文件夹',
          shortcutIds: [targetShortcut.id, sourceShortcut.id],
        }
        const desktopItems = current.desktopItems.filter((item) => item.id !== source.id && item.id !== target.id)
        desktopItems.push({
          id: `di-${folderId}`,
          workspaceId: source.workspaceId,
          kind: 'folder',
          refId: folderId,
          layout: target.layout ?? source.layout,
        })
        return { ...current, folders: [...current.folders, folder], desktopItems }
      }

      if (source.kind === 'shortcut' && target.kind === 'folder') {
        const targetFolder = current.folders.find((folder) => folder.id === target.refId)
        if (!targetFolder || targetFolder.shortcutIds.includes(source.refId)) return current
        return {
          ...current,
          folders: current.folders.map((folder) => folder.id === targetFolder.id
            ? { ...folder, shortcutIds: [...folder.shortcutIds, source.refId] }
            : folder),
          desktopItems: current.desktopItems.filter((item) => item.id !== source.id),
        }
      }

      return current
    })
  }

  const updateItemLayout = (itemId: string, requested: DesktopLayout) => {
    setState((current) => {
      const item = current.desktopItems.find((entry) => entry.id === itemId)
      if (!item || item.locked) return current
      const occupied = current.desktopItems
        .filter((entry) => entry.workspaceId === item.workspaceId && entry.id !== itemId && entry.layout)
        .map((entry) => entry.layout as DesktopLayout)
      const layout = findNearestFreeLayout(requested, occupied)
      const desktopItems = current.desktopItems.map((entry) => entry.id === itemId ? { ...entry, layout } : entry)
      const widgets = item.kind === 'widget'
        ? current.widgets.map((widget) => widget.id === item.refId ? { ...widget, size: widgetSizeFromLayout(layout) } : widget)
        : current.widgets
      return { ...current, desktopItems, widgets }
    })
  }

  const reorderFolderShortcut = (folderId: string, sourceId: string, targetId: string) => {
    setState((current) => ({
      ...current,
      folders: current.folders.map((folder) => {
        if (folder.id !== folderId) return folder
        const sourceIndex = folder.shortcutIds.indexOf(sourceId)
        const targetIndex = folder.shortcutIds.indexOf(targetId)
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return folder
        const shortcutIds = [...folder.shortcutIds]
        const [moved] = shortcutIds.splice(sourceIndex, 1)
        if (!moved) return folder
        shortcutIds.splice(targetIndex, 0, moved)
        return { ...folder, shortcutIds }
      }),
    }))
  }

  const extractFolderShortcut = (folderId: string, shortcutId: string) => {
    setState((current) => {
      const folder = current.folders.find((entry) => entry.id === folderId)
      const folderItem = current.desktopItems.find((entry) => entry.kind === 'folder' && entry.refId === folderId)
      if (!folder || !folderItem || !folder.shortcutIds.includes(shortcutId)) return current

      const remaining = folder.shortcutIds.filter((id) => id !== shortcutId)
      let folders = current.folders
      let desktopItems = [...current.desktopItems]

      if (remaining.length <= 1) {
        folders = current.folders.filter((entry) => entry.id !== folderId)
        desktopItems = desktopItems.filter((entry) => entry.id !== folderItem.id)
        const remainingId = remaining[0]
        if (remainingId) {
          desktopItems.push({
            id: desktopItems.some((entry) => entry.id === `di-${remainingId}`) ? `di-${crypto.randomUUID()}` : `di-${remainingId}`,
            workspaceId: folder.workspaceId,
            kind: 'shortcut',
            refId: remainingId,
            layout: folderItem.layout,
          })
        }
      } else {
        folders = current.folders.map((entry) => entry.id === folderId ? { ...entry, shortcutIds: remaining } : entry)
      }

      const extractedId = desktopItems.some((entry) => entry.id === `di-${shortcutId}`) ? `di-${crypto.randomUUID()}` : `di-${shortcutId}`
      desktopItems.push({
        id: extractedId,
        workspaceId: folder.workspaceId,
        kind: 'shortcut',
        refId: shortcutId,
        layout: getNextDesktopLayout(folder.workspaceId, 'shortcut', desktopItems, current.widgets),
      })

      return { ...current, folders, desktopItems }
    })
  }

  const removeItem = (item: DesktopItem) => {
    setState((current) => ({
      ...current,
      desktopItems: current.desktopItems.filter((entry) => entry.id !== item.id),
      widgets: item.kind === 'widget' ? current.widgets.filter((widget) => widget.id !== item.refId) : current.widgets,
    }))
    setContextTarget(null)
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
        layout: getNextDesktopLayout(shortcut.workspaceId, 'shortcut', current.desktopItems, current.widgets),
      }],
    }))
  }

  const addWidget = (type: WidgetType, size: WidgetSize) => {
    const id = crypto.randomUUID()
    setState((current) => ({
      ...current,
      widgets: [...current.widgets, { id, workspaceId: current.activeWorkspace, type, size, config: defaultWidgetConfig(type) }],
      desktopItems: [...current.desktopItems, {
        id: `di-${id}`,
        workspaceId: current.activeWorkspace,
        kind: 'widget',
        refId: id,
        layout: getNextDesktopLayout(current.activeWorkspace, 'widget', current.desktopItems, current.widgets, size),
      }],
    }))
  }

  const saveShortcut = (shortcut: Shortcut) => {
    setState((current) => ({ ...current, shortcuts: current.shortcuts.map((item) => item.id === shortcut.id ? shortcut : item) }))
  }

  const saveFolder = (folder: Folder) => {
    setState((current) => ({ ...current, folders: current.folders.map((item) => item.id === folder.id ? folder : item) }))
  }

  const updateWidget = (widget: WidgetInstance) => {
    setState((current) => ({ ...current, widgets: current.widgets.map((item) => item.id === widget.id ? widget : item) }))
  }

  const toggleDock = (shortcutId: string) => {
    setState((current) => ({
      ...current,
      dockShortcutIds: current.dockShortcutIds.includes(shortcutId)
        ? current.dockShortcutIds.filter((id) => id !== shortcutId)
        : [...current.dockShortcutIds, shortcutId],
    }))
    setContextTarget(null)
  }

  const pinToDock = (shortcutId: string) => {
    setState((current) => current.dockShortcutIds.includes(shortcutId)
      ? current
      : { ...current, dockShortcutIds: [...current.dockShortcutIds, shortcutId] })
  }

  const reorderDock = (sourceId: string, targetId: string) => {
    setState((current) => {
      const sourceIndex = current.dockShortcutIds.indexOf(sourceId)
      const targetIndex = current.dockShortcutIds.indexOf(targetId)
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current
      const dockShortcutIds = [...current.dockShortcutIds]
      const [moved] = dockShortcutIds.splice(sourceIndex, 1)
      if (!moved) return current
      dockShortcutIds.splice(targetIndex, 0, moved)
      return { ...current, dockShortcutIds }
    })
  }

  const removeFromDock = (shortcutId: string) => {
    setState((current) => ({ ...current, dockShortcutIds: current.dockShortcutIds.filter((id) => id !== shortcutId) }))
  }

  const toggleItemLock = (itemId: string) => {
    setState((current) => ({
      ...current,
      desktopItems: current.desktopItems.map((item) => item.id === itemId ? { ...item, locked: !item.locked } : item),
    }))
    setContextTarget(null)
  }

  const resizeWidget = (widgetId: string) => {
    setState((current) => {
      const widget = current.widgets.find((entry) => entry.id === widgetId)
      const item = current.desktopItems.find((entry) => entry.kind === 'widget' && entry.refId === widgetId)
      if (!widget || !item || item.locked) return current
      const index = sizeOrder.indexOf(widget.size)
      const size = sizeOrder[(index + 1) % sizeOrder.length] ?? 'small'
      const dimensions = getWidgetDimensions(size)
      const requested = { x: item.layout?.x ?? 0, y: item.layout?.y ?? 0, ...dimensions }
      const occupied = current.desktopItems
        .filter((entry) => entry.workspaceId === item.workspaceId && entry.id !== item.id && entry.layout)
        .map((entry) => entry.layout as DesktopLayout)
      const layout = findNearestFreeLayout(requested, occupied)
      return {
        ...current,
        widgets: current.widgets.map((entry) => entry.id === widgetId ? { ...entry, size } : entry),
        desktopItems: current.desktopItems.map((entry) => entry.id === item.id ? { ...entry, layout } : entry),
      }
    })
    setContextTarget(null)
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
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="wallpaper-layer" />
      <div className="wallpaper-overlay" />

      <SideRail
        visible={state.settings.showLeftRail}
        editMode={editMode}
        workspaces={workspaces}
        activeWorkspace={state.activeWorkspace}
        onWorkspaceChange={(activeWorkspace) => {
          setContextTarget(null)
          setState((current) => ({ ...current, activeWorkspace }))
        }}
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
          onMergeItems={mergeItems}
          onLayoutChange={updateItemLayout}
          onRemoveItem={removeItem}
          onContextMenu={(item, x, y) => setContextTarget({ item, x, y })}
          onFolderReorder={reorderFolderShortcut}
          onFolderExtract={extractFolderShortcut}
          onWidgetChange={updateWidget}
          onTasksChange={(tasks) => setState((current) => ({ ...current, tasks }))}
          onNotesChange={(value) => setState((current) => ({ ...current, notes: { ...current.notes, [current.activeWorkspace]: value } }))}
          onWeatherChange={updateWeather}
          onAdd={() => setAddOpen(true)}
        />
      </main>

      {editMode && (
        <div className="edit-toolbar" role="toolbar" aria-label="桌面编辑工具">
          <button onClick={undo} disabled={!canUndo} title="撤销（Ctrl/Cmd+Z）"><span aria-hidden="true">↶</span>撤销</button>
          <button onClick={redo} disabled={!canRedo} title="重做（Ctrl/Cmd+Shift+Z）"><span aria-hidden="true">↷</span>重做</button>
          <button className="edit-toolbar-finish" onClick={() => setEditMode(false)}><Icon name="check" />完成编辑</button>
        </div>
      )}

      <BottomDock
        visible={state.settings.showDock}
        magnify={state.settings.dockMagnify}
        editMode={editMode}
        shortcuts={state.shortcuts}
        shortcutIds={state.dockShortcutIds}
        iconShape={state.settings.iconShape}
        onAdd={() => setAddOpen(true)}
        onReorder={reorderDock}
        onRemove={removeFromDock}
        onPin={pinToDock}
      />

      {contextTarget && (
        <DesktopContextMenu
          target={contextTarget}
          shortcut={contextShortcut}
          folder={contextFolder}
          widget={contextWidget}
          pinned={Boolean(contextShortcut && state.dockShortcutIds.includes(contextShortcut.id))}
          locked={Boolean(contextTarget.item.locked)}
          onClose={() => setContextTarget(null)}
          onOpen={() => { if (contextShortcut) window.location.href = contextShortcut.url }}
          onEdit={() => {
            if (contextShortcut) setEditingShortcutId(contextShortcut.id)
            if (contextFolder) setEditingFolderId(contextFolder.id)
            setContextTarget(null)
          }}
          onToggleDock={() => contextShortcut && toggleDock(contextShortcut.id)}
          onToggleLock={() => toggleItemLock(contextTarget.item.id)}
          onResize={() => contextWidget && resizeWidget(contextWidget.id)}
          onRemove={() => removeItem(contextTarget.item)}
        />
      )}

      {editingShortcut && <ShortcutEditor shortcut={editingShortcut} onClose={() => setEditingShortcutId(null)} onSave={saveShortcut} />}
      {editingFolder && <FolderEditor folder={editingFolder} onClose={() => setEditingFolderId(null)} onSave={saveFolder} />}

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
