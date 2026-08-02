import { useState } from 'react'
import type { MouseEvent } from 'react'
import type { DesktopItem, Folder, Shortcut, Task, WeatherSnapshot, WidgetInstance, WorkspaceId } from '../core/types'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'
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
  onDropItem: (sourceId: string, targetId: string) => void
  onRemoveItem: (item: DesktopItem) => void
  onContextMenu: (item: DesktopItem, x: number, y: number) => void
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
  onDropItem,
  onRemoveItem,
  onContextMenu,
  onTasksChange,
  onNotesChange,
  onWeatherChange,
  onAdd,
}: Props) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  const renderWidget = (widget: WidgetInstance) => {
    if (widget.type === 'clock') return <ClockWidget now={now} />
    if (widget.type === 'weather') return <WeatherWidget weather={weather} onChange={onWeatherChange} />
    if (widget.type === 'calendar') return <CalendarMini now={now} />
    if (widget.type === 'countdown') return <CountdownWidget title={widget.title} />
    if (widget.type === 'tasks') return <TasksMini tasks={tasks} onChange={onTasksChange} />
    return <NotesMini value={notes} onChange={onNotesChange} />
  }

  const showContextMenu = (event: MouseEvent, item: DesktopItem) => {
    event.preventDefault()
    event.stopPropagation()
    onContextMenu(item, event.clientX, event.clientY)
  }

  const folder = folders.find((item) => item.id === openFolderId)
  const folderShortcuts = folder
    ? folder.shortcutIds.map((id) => shortcuts.find((shortcut) => shortcut.id === id)).filter(Boolean) as Shortcut[]
    : []
  const draggingItem = dragging ? items.find((item) => item.id === dragging) : undefined

  return (
    <>
      <section className={`desktop-canvas ${editMode ? 'editing' : ''}`} aria-label="桌面内容">
        {items.filter((item) => item.workspaceId === workspaceId).map((item) => {
          const shortcut = item.kind === 'shortcut' ? shortcuts.find((entry) => entry.id === item.refId) : undefined
          const currentFolder = item.kind === 'folder' ? folders.find((entry) => entry.id === item.refId) : undefined
          const widget = item.kind === 'widget' ? widgets.find((entry) => entry.id === item.refId) : undefined
          if (!shortcut && !currentFolder && !widget) return null
          const canMerge = draggingItem?.kind === 'shortcut' && (item.kind === 'shortcut' || item.kind === 'folder')

          return (
            <div
              key={item.id}
              className={`desktop-item desktop-item-${item.kind} ${dragging === item.id ? 'dragging' : ''} ${dropTarget === item.id ? (canMerge ? 'folder-merge-target' : 'reorder-target') : ''} ${widget ? `widget-span-${widget.size}` : ''}`}
              draggable={editMode}
              onContextMenu={(event) => showContextMenu(event, item)}
              onDragStart={(event) => {
                setDragging(item.id)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', item.id)
              }}
              onDragEnd={() => {
                setDragging(null)
                setDropTarget(null)
              }}
              onDragEnter={() => {
                if (editMode && dragging && dragging !== item.id) setDropTarget(item.id)
              }}
              onDragOver={(event) => {
                if (!editMode || !dragging || dragging === item.id) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null)
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (dragging && dragging !== item.id) onDropItem(dragging, item.id)
                setDragging(null)
                setDropTarget(null)
              }}
            >
              {shortcut && (
                <div className="desktop-shortcut-shell">
                  {editMode && <button className="desktop-remove icon-remove" onClick={() => onRemoveItem(item)}><Icon name="close" /></button>}
                  <a href={editMode ? undefined : shortcut.url} onClick={(event) => editMode && event.preventDefault()} className="desktop-shortcut">
                    <ShortcutIcon shortcut={shortcut} className={`app-icon shape-${iconShape}`} />
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
                        return child ? <ShortcutIcon key={id} shortcut={child} className="folder-mini-icon" /> : null
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

              {dropTarget === item.id && canMerge && (
                <span className="folder-merge-hint">{item.kind === 'folder' ? '移入文件夹' : '创建文件夹'}</span>
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
                  <ShortcutIcon shortcut={shortcut} className={`app-icon shape-${iconShape}`} />
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
