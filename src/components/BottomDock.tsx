import type { Shortcut } from '../core/types'
import { Icon } from './Icon'

interface Props {
  visible: boolean
  magnify: boolean
  shortcuts: Shortcut[]
  shortcutIds: string[]
  iconShape: string
  onAdd: () => void
}

export function BottomDock({ visible, magnify, shortcuts, shortcutIds, iconShape, onAdd }: Props) {
  if (!visible) return null
  const items = shortcutIds.map((id) => shortcuts.find((shortcut) => shortcut.id === id)).filter(Boolean) as Shortcut[]
  return (
    <nav className={`bottom-dock ${magnify ? 'dock-magnify' : ''}`} aria-label="快捷 Dock">
      {items.map((shortcut) => (
        <a key={shortcut.id} href={shortcut.url} title={shortcut.title}>
          <span className={`dock-icon shape-${iconShape}`} style={{ background: shortcut.color }}>{shortcut.icon}</span>
        </a>
      ))}
      <span className="dock-divider" />
      <button onClick={onAdd} title="添加到桌面"><span className={`dock-icon dock-add shape-${iconShape}`}><Icon name="plus" /></span></button>
    </nav>
  )
}
