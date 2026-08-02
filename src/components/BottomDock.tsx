import { useState } from 'react'
import type { DragEvent, Shortcut } from '../core/types'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'
import '../styles/folder-dock.css'

interface Props {
  visible: boolean
  magnify: boolean
  editMode: boolean
  shortcuts: Shortcut[]
  shortcutIds: string[]
  iconShape: string
  onAdd: () => void
  onReorder: (sourceId: string, targetId: string) => void
  onRemove: (shortcutId: string) => void
  onPin: (shortcutId: string) => void
}

export function BottomDock({ visible, magnify, editMode, shortcuts, shortcutIds, iconShape, onAdd, onReorder, onRemove, onPin }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [externalHover, setExternalHover] = useState(false)
  if (!visible) return null
  const items = shortcutIds.map((id) => shortcuts.find((shortcut) => shortcut.id === id)).filter(Boolean) as Shortcut[]

  const acceptExternalShortcut = (event: DragEvent<HTMLElement>) => {
    const shortcutId = event.dataTransfer.getData('application/x-weepwood-shortcut')
    if (!shortcutId) return false
    event.preventDefault()
    onPin(shortcutId)
    setExternalHover(false)
    return true
  }

  return (
    <nav
      className={`bottom-dock ${magnify ? 'dock-magnify' : ''} ${editMode ? 'dock-editing' : ''} ${externalHover ? 'dock-external-hover' : ''}`}
      aria-label="快捷 Dock"
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes('application/x-weepwood-shortcut')) setExternalHover(true)
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('application/x-weepwood-shortcut')) {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setExternalHover(false)
      }}
      onDrop={(event) => {
        if (!acceptExternalShortcut(event)) setExternalHover(false)
      }}
    >
      {items.map((shortcut) => (
        <div
          className={`dock-item ${dragging === shortcut.id ? 'dragging' : ''} ${dropTarget === shortcut.id ? 'drop-target' : ''}`}
          key={shortcut.id}
          draggable={editMode}
          onDragStart={(event) => {
            setDragging(shortcut.id)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('application/x-weepwood-dock-shortcut', shortcut.id)
          }}
          onDragEnd={() => {
            setDragging(null)
            setDropTarget(null)
          }}
          onDragEnter={() => {
            if (editMode && dragging && dragging !== shortcut.id) setDropTarget(shortcut.id)
          }}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes('application/x-weepwood-shortcut')) {
              event.preventDefault()
              return
            }
            if (!editMode || !dragging || dragging === shortcut.id) return
            event.preventDefault()
          }}
          onDrop={(event) => {
            event.preventDefault()
            event.stopPropagation()
            const externalId = event.dataTransfer.getData('application/x-weepwood-shortcut')
            if (externalId) {
              onPin(externalId)
              setExternalHover(false)
            } else if (dragging && dragging !== shortcut.id) {
              onReorder(dragging, shortcut.id)
            }
            setDragging(null)
            setDropTarget(null)
          }}
        >
          <a href={editMode ? undefined : shortcut.url} onClick={(event) => editMode && event.preventDefault()} title={shortcut.title}>
            <ShortcutIcon shortcut={shortcut} className={`dock-icon shape-${iconShape}`} />
          </a>
          {editMode && (
            <button className="dock-remove" onClick={() => onRemove(shortcut.id)} aria-label={`从 Dock 移除 ${shortcut.title}`}>
              <Icon name="close" />
            </button>
          )}
        </div>
      ))}
      {externalHover && <span className="dock-drop-message">释放以固定到 Dock</span>}
      <span className="dock-divider" />
      <button onClick={onAdd} title="添加到桌面"><span className={`dock-icon dock-add shape-${iconShape}`}><Icon name="plus" /></span></button>
    </nav>
  )
}
