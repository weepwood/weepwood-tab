import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { DesktopItem, Folder, Shortcut, WidgetInstance } from '../core/types'
import { Icon } from './Icon'

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
  onClose: () => void
  onOpen: () => void
  onEdit: () => void
  onToggleDock: () => void
  onResize: () => void
  onRemove: () => void
}

export function DesktopContextMenu({ target, shortcut, folder, widget, pinned, onClose, onOpen, onEdit, onToggleDock, onResize, onRemove }: MenuProps) {
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

  const left = Math.min(target.x, window.innerWidth - 220)
  const top = Math.min(target.y, window.innerHeight - 260)

  return (
    <div className="desktop-context-menu" style={{ left, top }} onPointerDown={(event) => event.stopPropagation()}>
      <div className="context-title">
        <span>{shortcut?.icon ?? (folder ? <Icon name="folder" /> : <Icon name="widgets" />)}</span>
        <div><strong>{shortcut?.title ?? folder?.title ?? widget?.title ?? '小组件'}</strong><small>{target.item.kind === 'shortcut' ? '快捷方式' : target.item.kind === 'folder' ? '文件夹' : '桌面小组件'}</small></div>
      </div>
      {shortcut && <button onClick={onOpen}><Icon name="external" />打开</button>}
      {(shortcut || folder) && <button onClick={onEdit}><Icon name="edit" />编辑</button>}
      {shortcut && <button onClick={onToggleDock}><Icon name="dock" />{pinned ? '从 Dock 取消固定' : '固定到 Dock'}</button>}
      {widget && <button onClick={onResize}><Icon name="layout" />切换组件尺寸</button>}
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
  const [title, setTitle] = useState(shortcut.title)
  const [url, setUrl] = useState(shortcut.url)
  const [icon, setIcon] = useState(shortcut.icon)
  const [color, setColor] = useState(shortcut.color)
  const colors = ['#17191f', '#4d78e8', '#35a86b', '#ec7696', '#ff5a25', '#7656d6', '#e4584e']

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !url.trim()) return
    onSave({
      ...shortcut,
      title: title.trim(),
      url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
      icon: icon.trim().slice(0, 2) || title.trim().slice(0, 1),
      color,
    })
    onClose()
  }

  return (
    <div className="panel-backdrop editor-backdrop" onMouseDown={onClose}>
      <section className="shortcut-editor" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><small>EDIT SHORTCUT</small><h2>编辑快捷方式</h2></div><button onClick={onClose}><Icon name="close" /></button></header>
        <form onSubmit={submit}>
          <label><span>名称</span><input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
          <label><span>网址</span><input value={url} onChange={(event) => setUrl(event.target.value)} /></label>
          <div className="form-two-columns">
            <label><span>图标文字</span><input value={icon} maxLength={2} onChange={(event) => setIcon(event.target.value)} /></label>
            <label><span>图标颜色</span><div className="color-options">{colors.map((item) => <button key={item} type="button" className={color === item ? 'active' : ''} style={{ background: item }} onClick={() => setColor(item)} />)}</div></label>
          </div>
          <button className="primary-action" type="submit"><Icon name="check" />保存修改</button>
        </form>
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
