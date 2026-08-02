import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { DesktopItem, DesktopLayout, Folder, Shortcut, Task, WeatherSnapshot, WidgetInstance, WorkspaceId } from '../core/types'
import {
  clampLayout,
  DESKTOP_COLUMNS,
  DESKTOP_GAP,
  DESKTOP_ROW_HEIGHT,
  findNearestFreeLayout,
  getDefaultItemSize,
} from '../core/layout'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'
import { FolderContents } from './FolderContents'
import { CalendarMini, ClockWidget, CountdownWidget, NotesMini, TasksMini, WeatherWidget, WidgetFrame } from './Widgets'
import '../styles/free-layout.css'

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
  onMergeItems: (sourceId: string, targetId: string) => void
  onLayoutChange: (itemId: string, layout: DesktopLayout) => void
  onRemoveItem: (item: DesktopItem) => void
  onContextMenu: (item: DesktopItem, x: number, y: number) => void
  onFolderReorder: (folderId: string, sourceId: string, targetId: string) => void
  onFolderExtract: (folderId: string, shortcutId: string) => void
  onTasksChange: (tasks: Task[]) => void
  onNotesChange: (value: string) => void
  onWeatherChange: (weather: WeatherSnapshot) => void
  onAdd: () => void
}

interface PointerInteraction {
  itemId: string
  mode: 'move' | 'resize'
  startX: number
  startY: number
  origin: DesktopLayout
  draft: DesktopLayout
  mergeTargetId: string | null
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
  onMergeItems,
  onLayoutChange,
  onRemoveItem,
  onContextMenu,
  onFolderReorder,
  onFolderExtract,
  onTasksChange,
  onNotesChange,
  onWeatherChange,
  onAdd,
}: Props) {
  const canvasRef = useRef<HTMLElement>(null)
  const interactionRef = useRef<PointerInteraction | null>(null)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [draftLayout, setDraftLayout] = useState<DesktopLayout | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null)
  const [openFolderId, setOpenFolderId] = useState<string | null>(null)

  useEffect(() => {
    const element = canvasRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setCanvasWidth(entry?.contentRect.width ?? 0))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const compactMode = canvasWidth > 0 && canvasWidth < 760
  const cellWidth = canvasWidth > 0
    ? Math.max(56, (canvasWidth - DESKTOP_GAP * (DESKTOP_COLUMNS - 1)) / DESKTOP_COLUMNS)
    : 80
  const columnStep = cellWidth + DESKTOP_GAP
  const rowStep = DESKTOP_ROW_HEIGHT + DESKTOP_GAP

  const resolvedItems = useMemo(() => items.map((item, index) => {
    const size = getDefaultItemSize(item, widgets)
    return {
      ...item,
      layout: item.layout ?? {
        x: index % DESKTOP_COLUMNS,
        y: Math.floor(index / DESKTOP_COLUMNS),
        ...size,
      },
    }
  }), [items, widgets])

  const itemById = useMemo(() => new Map(resolvedItems.map((item) => [item.id, item])), [resolvedItems])

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

  const beginInteraction = (
    event: ReactPointerEvent,
    item: DesktopItem & { layout: DesktopLayout },
    mode: PointerInteraction['mode'],
  ) => {
    if (!editMode || compactMode || event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    const interaction: PointerInteraction = {
      itemId: item.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin: item.layout,
      draft: item.layout,
      mergeTargetId: null,
    }
    interactionRef.current = interaction
    setActiveItemId(item.id)
    setDraftLayout(item.layout)
    setMergeTargetId(null)
  }

  useEffect(() => {
    if (!activeItemId) return

    const move = (event: PointerEvent) => {
      const interaction = interactionRef.current
      if (!interaction) return
      const deltaX = Math.round((event.clientX - interaction.startX) / columnStep)
      const deltaY = Math.round((event.clientY - interaction.startY) / rowStep)
      const next = interaction.mode === 'move'
        ? clampLayout({ ...interaction.origin, x: interaction.origin.x + deltaX, y: interaction.origin.y + deltaY })
        : clampLayout({
            ...interaction.origin,
            w: Math.max(1, interaction.origin.w + deltaX),
            h: Math.max(1, interaction.origin.h + deltaY),
          })

      interaction.draft = next
      setDraftLayout(next)

      if (interaction.mode !== 'move') {
        interaction.mergeTargetId = null
        setMergeTargetId(null)
        return
      }

      const source = itemById.get(interaction.itemId)
      if (source?.kind !== 'shortcut') {
        interaction.mergeTargetId = null
        setMergeTargetId(null)
        return
      }

      const targetElement = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-desktop-item-id]')
      const targetId = targetElement?.dataset.desktopItemId
      const target = targetId ? itemById.get(targetId) : undefined
      const nextTarget = target && target.id !== source.id && (target.kind === 'shortcut' || target.kind === 'folder') ? target.id : null
      interaction.mergeTargetId = nextTarget
      setMergeTargetId(nextTarget)
    }

    const end = () => {
      const interaction = interactionRef.current
      if (!interaction) return
      if (interaction.mode === 'move' && interaction.mergeTargetId) {
        onMergeItems(interaction.itemId, interaction.mergeTargetId)
      } else {
        onLayoutChange(interaction.itemId, interaction.draft)
      }
      interactionRef.current = null
      setActiveItemId(null)
      setDraftLayout(null)
      setMergeTargetId(null)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end, { once: true })
    window.addEventListener('pointercancel', end, { once: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [activeItemId, columnStep, itemById, onLayoutChange, onMergeItems, rowStep])

  const layoutStyle = (layout: DesktopLayout): CSSProperties => ({
    left: layout.x * columnStep,
    top: layout.y * rowStep,
    width: layout.w * cellWidth + (layout.w - 1) * DESKTOP_GAP,
    height: layout.h * DESKTOP_ROW_HEIGHT + (layout.h - 1) * DESKTOP_GAP,
  })

  const occupiedLayouts = resolvedItems.map((item) => item.layout)
  const addLayout = findNearestFreeLayout({ x: 0, y: 0, w: 1, h: 1 }, occupiedLayouts)
  const maxBottom = Math.max(5, ...resolvedItems.map((item) => item.layout.y + item.layout.h), addLayout.y + 1)
  const minHeight = maxBottom * rowStep + 36
  const folder = folders.find((item) => item.id === openFolderId)

  useEffect(() => {
    if (openFolderId && !folder) setOpenFolderId(null)
  }, [folder, openFolderId])

  return (
    <>
      <section
        ref={canvasRef}
        className={`desktop-canvas free-layout-canvas ${editMode ? 'editing' : ''} ${compactMode ? 'is-compact' : ''}`}
        style={!compactMode ? { minHeight } : undefined}
        aria-label="桌面内容"
      >
        {resolvedItems.filter((item) => item.workspaceId === workspaceId).map((item) => {
          const shortcut = item.kind === 'shortcut' ? shortcuts.find((entry) => entry.id === item.refId) : undefined
          const currentFolder = item.kind === 'folder' ? folders.find((entry) => entry.id === item.refId) : undefined
          const widget = item.kind === 'widget' ? widgets.find((entry) => entry.id === item.refId) : undefined
          if (!shortcut && !currentFolder && !widget) return null
          const effectiveLayout = activeItemId === item.id && draftLayout ? draftLayout : item.layout
          const isMergeTarget = mergeTargetId === item.id

          return (
            <div
              key={item.id}
              data-desktop-item-id={item.id}
              className={`desktop-item free-layout-item desktop-item-${item.kind} ${activeItemId === item.id ? 'is-pointer-dragging' : ''} ${isMergeTarget ? 'folder-merge-target' : ''} ${widget ? `widget-span-${widget.size}` : ''}`}
              style={!compactMode ? layoutStyle(effectiveLayout) : undefined}
              onContextMenu={(event) => showContextMenu(event, item)}
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
                  <button className="desktop-shortcut folder-shortcut" onClick={() => setOpenFolderId(currentFolder.id)}>
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

              {editMode && !compactMode && (
                <button
                  className="layout-move-handle"
                  onPointerDown={(event) => beginInteraction(event, item, 'move')}
                  aria-label="拖动项目"
                  title="拖动项目"
                >
                  <Icon name="layout" />
                </button>
              )}

              {editMode && !compactMode && widget && (
                <button
                  className="layout-resize-handle"
                  onPointerDown={(event) => beginInteraction(event, item, 'resize')}
                  aria-label="调整组件尺寸"
                  title="拖动调整尺寸"
                />
              )}

              {isMergeTarget && (
                <span className="folder-merge-hint">{item.kind === 'folder' ? '移入文件夹' : '创建文件夹'}</span>
              )}
            </div>
          )
        })}

        <button
          className="desktop-add free-layout-add"
          style={!compactMode ? layoutStyle(addLayout) : undefined}
          onClick={onAdd}
          aria-label="添加内容"
        >
          <Icon name="plus" />
          <span>添加</span>
        </button>
      </section>

      {folder && (
        <FolderContents
          folder={folder}
          shortcuts={shortcuts}
          iconShape={iconShape}
          editMode={editMode}
          onClose={() => setOpenFolderId(null)}
          onReorder={onFolderReorder}
          onExtract={onFolderExtract}
        />
      )}
    </>
  )
}
