import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { DesktopItem, Folder, Shortcut, WidgetInstance } from '../core/types'
import { copyShortcutUrl, describeShortcutUrl, openShortcut } from '../core/shortcutLinks'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'
import { ShortcutForm } from './ShortcutForm'

export interface ContextTarget {
  item: DesktopItem
  x: number
  y: number
}

interface MenuProps {
  target: ContextTarget
  shortcut?: Shortcut
  folder?: Folder
  widget?: WidgetInstance
  pinned: boolean
  locked: boolean
  onClose: () => void
  onOpen: () => void
  onEdit: () => void
  onToggleDock: () => void
  onToggleLock: () => void
  onResize: () => void
  onRemove: () => void
}

export function DesktopContextMenu({ target, shortcut, folder, widget, pinned, locked, onClose, onOpen, onEdit, onToggleDock, onToggleLock, onResize, onRemove }: MenuProps) {
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    const close = () => onClose()
    const keyboard = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', keyboard)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', keyboard)
    }
  }, [onClose])

  const left = Math.min(target.x, window.innerWidth - 232)
  const top = Math.min(target.y, window.innerHeight - 390)

  const open = (newTab = false) => {
    if (shortcut) openShortcut(shortcut, newTab ? 'newTab' : undefined)
    else onOpen()
    onClose()
  }

  const copy = async () => {
    if (!shortcut) return
    const copied = await copyShortcutUrl(shortcut.url)
    setCopyStatus(copied ? '已复制' : '复制失败')
    window.setTimeout(onClose, 650)
  }

  return (
    <div className="desktop-context-menu shortcut-context-menu" style={{ left, top }} onPointerDown={(event) => event.stopPropagation()}>
      <div className="context-title">
        {shortcut ? <ShortcutIcon shortcut={shortcut} className="context-shortcut-icon" /> : <span>{folder ? <Icon name="folder" /> : <Icon name="widgets" />}</span>}
        <div>
          <strong>{shortcut?.title ?? folder?.title ?? widget?.title ?? '小组件'}</strong>
          <small>{shortcut ? describeShortcutUrl(shortcut.url) : target.item.kind === 'folder' ? '文件夹' : '桌面小组件'}</small>
        </div>
      </div>
      {shortcut && <button onClick={() => open(false)}><Icon name="external" />按设定方式打开</button>}
      {shortcut && <button onClick={() => open(true)}><Icon name="plus" />在新标签页打开</button>}
      {shortcut && <button onClick={() => void copy()}><Icon name="download" />{copyStatus || '复制链接'}</button>}
      {(shortcut || folder) && <button onClick={onEdit}><Icon name="edit" />编辑</button>}
      {shortcut && <button onClick={onToggleDock}><Icon name="dock" />{pinned ? '从 Dock 取消固定' : '固定到 Dock'}</button>}
      <button onClick={onToggleLock}><span className="context-emoji" aria-hidden="true">{locked ? '🔓' : '🔒'}</span>{locked ? '解锁位置' : '锁定位置'}</button>
      {widget && !locked && <button onClick={onResize}><Icon name="layout" />切换组件尺寸</button>}
      <span className="context-divider" />
      <button className="danger" onClick={onRemove}><Icon name="trash" />从桌面移除</button>
    </div>
  )
}

interface ShortcutEditorProps {
  shortcut: Shortcut
  onClose: () => void
  onSave: (shortcut: Shortcut) => void
}

export function ShortcutEditor({ shortcut, onClose, onSave }: ShortcutEditorProps) {
  return (
    <div className="panel-backdrop editor-backdrop" onMouseDown={onClose}>
      <section className="shortcut-editor shortcut-editor-deep" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><small>EDIT SHORTCUT</small><h2>编辑快捷方式</h2></div><button onClick={onClose}><Icon name="close" /></button></header>
        <ShortcutForm
          workspaceId={shortcut.workspaceId}
          initial={shortcut}
          submitLabel="保存修改"
          onCancel={onClose}
          onSubmit={(next) => { onSave(next); onClose() }}
        />
      </section>
    </div>
  )
}

interface FolderEditorProps {
  folder: Folder
  onClose: () => void
  onSave: (folder: Folder) => void
}

export function FolderEditor({ folder, onClose, onSave }: FolderEditorProps) {
  const [title, setTitle] = useState(folder.title)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    onSave({ ...folder, title: title.trim() })
    onClose()
  }
  return (
    <div className="panel-backdrop editor-backdrop" onMouseDown={onClose}>
      <section className="shortcut-editor folder-editor" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><small>EDIT FOLDER</small><h2>重命名文件夹</h2></div><button onClick={onClose}><Icon name="close" /></button></header>
        <form onSubmit={submit}>
          <label><span>文件夹名称</span><input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
          <button className="primary-action" type="submit"><Icon name="check" />保存名称</button>
        </form>
      </section>
    </div>
  )
}
