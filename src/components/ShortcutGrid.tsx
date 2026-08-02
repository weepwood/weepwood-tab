import { useState } from 'react'
import type { Shortcut } from '../core/types'
import { Icon } from './Icon'

interface Props {
  shortcuts: Shortcut[]
  editMode: boolean
  compact: boolean
  onAdd: () => void
  onDelete: (id: string) => void
  onReorder: (sourceId: string, targetId: string) => void
}

export function ShortcutGrid({ shortcuts, editMode, compact, onAdd, onDelete, onReorder }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)

  return (
    <section className="section-block">
      <div className="section-heading">
        <div><span className="eyebrow">QUICK ACCESS</span><h2>常用入口</h2></div>
        <span className="section-meta">{editMode ? '拖动图标调整顺序' : `${shortcuts.length} 个快捷方式`}</span>
      </div>
      <div className={`shortcut-grid ${compact ? 'is-compact' : ''}`}>
        {shortcuts.map((item) => (
          <div
            className={`shortcut-shell ${dragging === item.id ? 'is-dragging' : ''}`}
            key={item.id}
            draggable={editMode}
            onDragStart={() => setDragging(item.id)}
            onDragEnd={() => setDragging(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragging && dragging !== item.id) onReorder(dragging, item.id)
            }}
          >
            <a href={editMode ? undefined : item.url} className="shortcut-card" onClick={(event) => editMode && event.preventDefault()}>
              <span className="shortcut-icon" style={{ background: item.color }}>{item.icon}</span>
              <span className="shortcut-title">{item.title}</span>
              <span className="shortcut-arrow">↗</span>
            </a>
            {editMode && <button className="shortcut-delete" onClick={() => onDelete(item.id)} aria-label={`删除 ${item.title}`}><Icon name="close" /></button>}
          </div>
        ))}
        <button className="shortcut-card add-shortcut" onClick={onAdd}>
          <span className="shortcut-icon"><Icon name="plus" /></span>
          <span className="shortcut-title">添加入口</span>
        </button>
      </div>
    </section>
  )
}
