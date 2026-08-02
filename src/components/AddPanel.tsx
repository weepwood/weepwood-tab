import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Shortcut, WidgetSize, WidgetType, WorkspaceId } from '../core/types'
import { Icon } from './Icon'

const colors = ['#17191f', '#4d78e8', '#35a86b', '#ec7696', '#ff5a25', '#7656d6', '#e4584e']
const widgetOptions: Array<{ type: WidgetType; title: string; description: string; icon: 'clock' | 'calendar' | 'task' | 'note' | 'location' | 'sparkles'; size: WidgetSize }> = [
  { type: 'clock', title: '时钟', description: '大号时间与日期', icon: 'clock', size: 'medium' },
  { type: 'weather', title: '天气', description: '基于当前位置获取天气', icon: 'location', size: 'small' },
  { type: 'calendar', title: '日历', description: '快速查看本月日期', icon: 'calendar', size: 'small' },
  { type: 'countdown', title: '倒计时', description: '查看今年剩余时间', icon: 'sparkles', size: 'wide' },
  { type: 'tasks', title: '待办', description: '记录当天任务', icon: 'task', size: 'tall' },
  { type: 'notes', title: '随手记', description: '保存临时想法与链接', icon: 'note', size: 'wide' },
]

interface Props {
  open: boolean
  workspaceId: WorkspaceId
  onClose: () => void
  onAddShortcut: (shortcut: Shortcut) => void
  onAddWidget: (type: WidgetType, size: WidgetSize) => void
}

export function AddPanel({ open, workspaceId, onClose, onAddShortcut, onAddWidget }: Props) {
  const [tab, setTab] = useState<'widgets' | 'shortcut'>('widgets')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('https://')
  const [icon, setIcon] = useState('W')
  const [color, setColor] = useState(colors[1] ?? '#4d78e8')

  if (!open) return null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !url.trim()) return
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`
    onAddShortcut({
      id: crypto.randomUUID(),
      workspaceId,
      title: title.trim(),
      url: normalized,
      icon: icon.trim().slice(0, 2) || title.trim().slice(0, 1),
      color,
    })
    setTitle('')
    setUrl('https://')
    setIcon('W')
    onClose()
  }

  return (
    <div className="panel-backdrop" onMouseDown={onClose}>
      <aside className="floating-panel add-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="panel-header">
          <div><small>ADD TO DESKTOP</small><h2>添加内容</h2></div>
          <button className="panel-close" onClick={onClose}><Icon name="close" /></button>
        </header>

        <div className="panel-tabs">
          <button className={tab === 'widgets' ? 'active' : ''} onClick={() => setTab('widgets')}><Icon name="widgets" />小组件</button>
          <button className={tab === 'shortcut' ? 'active' : ''} onClick={() => setTab('shortcut')}><Icon name="grid" />快捷方式</button>
        </div>

        {tab === 'widgets' ? (
          <div className="widget-library">
            {widgetOptions.map((widget) => (
              <button key={widget.type} onClick={() => { onAddWidget(widget.type, widget.size); onClose() }}>
                <span><Icon name={widget.icon} /></span>
                <div><strong>{widget.title}</strong><small>{widget.description}</small></div>
                <Icon name="plus" />
              </button>
            ))}
          </div>
        ) : (
          <form className="shortcut-form" onSubmit={submit}>
            <label><span>名称</span><input value={title} onChange={(event) => { setTitle(event.target.value); if (icon === 'W' && event.target.value) setIcon(event.target.value.slice(0, 1).toUpperCase()) }} placeholder="例如 GitHub" autoFocus /></label>
            <label><span>网址</span><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" /></label>
            <div className="form-two-columns">
              <label><span>图标文字</span><input value={icon} maxLength={2} onChange={(event) => setIcon(event.target.value)} /></label>
              <label><span>图标颜色</span><div className="color-options">{colors.map((item) => <button type="button" key={item} className={color === item ? 'active' : ''} style={{ background: item }} onClick={() => setColor(item)} aria-label={item} />)}</div></label>
            </div>
            <button className="primary-action" type="submit"><Icon name="plus" />添加到当前空间</button>
          </form>
        )}
      </aside>
    </div>
  )
}
