import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Shortcut, WorkspaceId } from '../core/types'
import { Icon } from './Icon'

const colors = ['#4865dc', '#8754d8', '#e0627d', '#d18138', '#2f927b', '#273149']

export function AddShortcutModal({ workspaceId, onClose, onAdd }: { workspaceId: WorkspaceId; onClose: () => void; onAdd: (shortcut: Shortcut) => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('https://')
  const [icon, setIcon] = useState('W')
  const [color, setColor] = useState(colors[0] ?? '#4865dc')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !url.trim()) return
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`
    onAdd({ id: crypto.randomUUID(), workspaceId, title: title.trim(), url: normalized, icon: icon.trim().slice(0, 2) || title.trim().slice(0, 1), color })
    onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header"><div><span className="eyebrow">NEW SHORTCUT</span><h2>添加快捷方式</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div>
        <form onSubmit={submit}>
          <label>名称<input value={title} onChange={(event) => { setTitle(event.target.value); if (icon === 'W' && event.target.value) setIcon(event.target.value.slice(0, 1).toUpperCase()) }} placeholder="例如 GitHub" autoFocus /></label>
          <label>网址<input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" /></label>
          <div className="form-row"><label>图标文字<input value={icon} maxLength={2} onChange={(event) => setIcon(event.target.value)} /></label><label>图标颜色<span className="color-options">{colors.map((item) => <button type="button" key={item} className={color === item ? 'active' : ''} style={{ background: item }} onClick={() => setColor(item)} aria-label={item} />)}</span></label></div>
          <button className="primary-button" type="submit"><Icon name="plus" />添加到当前工作区</button>
        </form>
      </div>
    </div>
  )
}
