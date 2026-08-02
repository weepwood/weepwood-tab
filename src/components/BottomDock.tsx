import type { Shortcut } from '../core/types'
import { Icon } from './Icon'
import { ShortcutIcon } from './ShortcutIcon'

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
          <ShortcutIcon shortcut={shortcut} className={`dock-icon shape-${iconShape}`} />
        </a>
      ))}
      <span className="dock-divider" />
      <button onClick={onAdd} title="添加到桌面"><span className={`dock-icon dock-add shape-${iconShape}`}><Icon name="plus" /></span></button>
    </nav>
  )
}
