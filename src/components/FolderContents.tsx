import { useState } from 'react'
import type { Folder, Shortcut } from '../core/types'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'

interface Props {
  folder: Folder
  shortcuts: Shortcut[]
  iconShape: string
  editMode: boolean
  onClose: () => void
  onReorder: (folderId: string, sourceId: string, targetId: string) => void
  onExtract: (folderId: string, shortcutId: string) => void
}

export function FolderContents({ folder, shortcuts, iconShape, editMode, onClose, onReorder, onExtract }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const folderShortcuts = folder.shortcutIds
    .map((id) => shortcuts.find((shortcut) => shortcut.id === id))
    .filter(Boolean) as Shortcut[]

  return (
    <div className="folder-backdrop" onMouseDown={onClose}>
      <section className={`folder-popover ${editMode ? 'folder-editing' : ''}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="folder-header">
          <div><h2>{folder.title}</h2>{editMode && <small>拖动排序，点击减号移回桌面</small>}</div>
          <button onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="folder-grid">
          {folderShortcuts.map((shortcut) => (
            <div
              className={`folder-grid-item ${dragging === shortcut.id ? 'dragging' : ''} ${dropTarget === shortcut.id ? 'drop-target' : ''}`}
              key={shortcut.id}
              draggable={editMode}
              onDragStart={(event) => {
                setDragging(shortcut.id)
                event.dataTransfer.effectAllowed = 'move'
              }}
              onDragEnd={() => {
                setDragging(null)
                setDropTarget(null)
              }}
              onDragEnter={() => {
                if (editMode && dragging && dragging !== shortcut.id) setDropTarget(shortcut.id)
              }}
              onDragOver={(event) => {
                if (!editMode || !dragging || dragging === shortcut.id) return
                event.preventDefault()
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (dragging && dragging !== shortcut.id) onReorder(folder.id, dragging, shortcut.id)
                setDragging(null)
                setDropTarget(null)
              }}
            >
              <a href={editMode ? undefined : shortcut.url} onClick={(event) => editMode && event.preventDefault()}>
                <ShortcutIcon shortcut={shortcut} className={`app-icon shape-${iconShape}`} />
                <small>{shortcut.title}</small>
              </a>
              {editMode && (
                <button className="folder-extract" onClick={() => onExtract(folder.id, shortcut.id)} aria-label={`将 ${shortcut.title} 移回桌面`}>
                  <Icon name="close" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
