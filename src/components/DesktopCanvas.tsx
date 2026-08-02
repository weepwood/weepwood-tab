import { useState } from 'react'
import type { DesktopItem, Folder, Shortcut, Task, WeatherSnapshot, WidgetInstance, WorkspaceId } from '../core/types'
import { Icon } from './Icon'
import { CalendarMini, ClockWidget, CountdownWidget, NotesMini, TasksMini, WeatherWidget, WidgetFrame } from './Widgets'

interface Props {
  workspaceId: WorkspaceId
  items: DesktopItem[]
  shortcuts: Shortcut[]
  folders: Folder[]
  widgets: WidgetInstance[]
  tasks: Task[]
  notes: string
  weather?: WeatherSnapshot
  now: Date
  editMode: boolean
  iconShape: string
  onReorder: (sourceId: string, targetId: string) => void
  onRemoveItem: (item: DesktopItem) => void
  onTasksChange: (tasks: Task[]) => void
  onNotesChange: (value: string) => void
  onWeatherChange: (weather: WeatherSnapshot) => void
  onAdd: () => void
}

export function DesktopCanvas({
  workspaceId,
  items,
  shortcuts,
  folders,
  widgets,
  tasks,
  notes,
  weather,
  now,
  editMode,
  iconShape,
  onReorder,
  onRemoveItem,
  onTasksChange,
  onNotesChange,
  onWeatherChange,
  onAdd,
}: Props) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  const renderWidget = (widget: WidgetInstance) => {
    if (widget.type === 'clock') return <ClockWidget now={now} />
    if (widget.type === 'weather') return <WeatherWidget weather={weather} onChange={onWeatherChange} />
    if (widget.type === 'calendar') return <CalendarMini now={now} />
    if (widget.type === 'countdown') return <CountdownWidget title={widget.title} />
    if (widget.type === 'tasks') return <TasksMini tasks={tasks} onChange={onTasksChange} />
    return <NotesMini value={notes} onChange={onNotesChange} />
  }

  const folder = folders.find((item) => item.id === openFolderId)
  const folderShortcuts = folder
    ? folder.shortcutIds.map((id) => shortcuts.find((shortcut) => shortcut.id === id)).filter(Boolean) as Shortcut[]
    : []

  return (
    <>
      <section className={`desktop-canvas ${editMode ? 'editing' : ''}`} aria-label="桌面内容">
        {items.filter((item) => item.workspaceId === workspaceId).map((item) => {
          const shortcut = item.kind === 'shortcut' ? shortcuts.find((entry) => entry.id === item.refId) : undefined
          const currentFolder = item.kind === 'folder' ? folders.find((entry) => entry.id === item.refId) : undefined
          const widget = item.kind === 'widget' ? widgets.find((entry) => entry.id === item.refId) : undefined
          if (!shortcut && !currentFolder && !widget) return null

          return (
            <div
              key={item.id}
              className={`desktop-item desktop-item-${item.kind} ${dragging === item.id ? 'dragging' : ''} ${widget ? `widget-span-${widget.size}` : ''}`}
              draggable={editMode}
              onDragStart={() => setDragging(item.id)}
              onDragEnd={() => setDragging(null)}
              onDragOver={(event) => editMode && event.preventDefault()}
              onDrop={() => {
                if (dragging && dragging !== item.id) onReorder(dragging, item.id)
              }}
            >
              {shortcut && (
                <div className="desktop-shortcut-shell">
                  {editMode && <button className="desktop-remove icon-remove" onClick={() => onRemoveItem(item)}><Icon name="close" /></button>}
                  <a href={editMode ? undefined : shortcut.url} onClick={(event) => editMode && event.preventDefault()} className="desktop-shortcut">
                    <span className={`app-icon shape-${iconShape}`} style={{ background: shortcut.color }}>{shortcut.icon}</span>
                    <span>{shortcut.title}</span>
                  </a>
                </div>
              )}

              {currentFolder && (
                <div className="desktop-shortcut-shell">
                  {editMode && <button className="desktop-remove icon-remove" onClick={() => onRemoveItem(item)}><Icon name="close" /></button>}
                  <button className="desktop-shortcut folder-shortcut" onClick={() => !editMode && setOpenFolderId(currentFolder.id)}>
                    <span className={`folder-icon shape-${iconShape}`}>
                      {currentFolder.shortcutIds.slice(0, 4).map((id) => {
                        const child = shortcuts.find((entry) => entry.id === id)
                        return child ? <i key={id} style={{ background: child.color }}>{child.icon}</i> : null
                      })}
                    </span>
                    <span>{currentFolder.title}</span>
                  </button>
                </div>
              )}

              {widget && (
                <WidgetFrame widget={widget} editMode={editMode} onRemove={() => onRemoveItem(item)}>
                  {renderWidget(widget)}
                </WidgetFrame>
              )}
            </div>
          )
        })}

        <button className="desktop-add" onClick={onAdd} aria-label="添加内容">
          <Icon name="plus" />
          <span>添加</span>
        </button>
      </section>

      {folder && (
        <div className="folder-backdrop" onMouseDown={() => setOpenFolderId(null)}>
          <section className="folder-popover" onMouseDown={(event) => event.stopPropagation()}>
            <div className="folder-header"><h2>{folder.title}</h2><button onClick={() => setOpenFolderId(null)}><Icon name="close" /></button></div>
            <div className="folder-grid">
              {folderShortcuts.map((shortcut) => (
                <a key={shortcut.id} href={shortcut.url}>
                  <span className={`app-icon shape-${iconShape}`} style={{ background: shortcut.color }}>{shortcut.icon}</span>
                  <small>{shortcut.title}</small>
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
