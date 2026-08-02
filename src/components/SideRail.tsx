import { useEffect } from 'react'
import type { Workspace, WorkspaceId } from '../core/types'
import { APPEARANCE_EVENT, applyWorkspaceAppearance } from '../core/workspaceAppearance'
import { Icon } from './Icon'

interface Props {
  visible: boolean
  editMode: boolean
  workspaces: Workspace[]
  activeWorkspace: WorkspaceId
  onWorkspaceChange: (id: WorkspaceId) => void
  onAdd: () => void
  onWallpaper: () => void
  onSettings: () => void
  onEdit: () => void
}

export function SideRail({ visible, editMode, workspaces, activeWorkspace, onWorkspaceChange, onAdd, onWallpaper, onSettings, onEdit }: Props) {
  useEffect(() => {
    const apply = () => applyWorkspaceAppearance(activeWorkspace)
    apply()
    window.addEventListener(APPEARANCE_EVENT, apply)
    return () => window.removeEventListener(APPEARANCE_EVENT, apply)
  }, [activeWorkspace])

  if (!visible) return null
  return (
    <aside className="side-rail" aria-label="快捷控制栏">
      <button className="rail-avatar" title="本地账户"><Icon name="user" /></button>
      <div className="rail-main">
        <button className="active" title="首页"><Icon name="home" /></button>
        <button onClick={onAdd} title="添加内容"><Icon name="plus" /></button>
        <button onClick={onEdit} className={editMode ? 'active' : ''} title={editMode ? '完成编辑' : '编辑桌面'}><Icon name={editMode ? 'check' : 'edit'} /></button>
        <button onClick={onWallpaper} title="更换壁纸"><Icon name="wallpaper" /></button>
      </div>
      <div className="rail-workspaces" aria-label="切换空间">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            className={workspace.id === activeWorkspace ? 'active' : ''}
            onClick={() => onWorkspaceChange(workspace.id)}
            title={workspace.name}
          >
            {workspace.icon}
          </button>
        ))}
      </div>
      <button className="rail-settings" onClick={onSettings} title="设置"><Icon name="settings" /></button>
    </aside>
  )
}
