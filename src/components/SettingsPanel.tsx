import { useRef, useState } from 'react'
import type { AppSettings, DockPosition, PersistedState, WallpaperId, WorkspaceAppearance, WorkspaceId } from '../core/types'
import { canImportBrowserBookmarks, readBrowserBookmarks } from '../core/browserBookmarks'
import type { ImportedBookmark } from '../core/browserBookmarks'
import { canUseBrowserSync, clearBrowserSync, readBrowserSync, writeBrowserSync } from '../core/browserSync'
import { Icon } from './Icon'

const wallpaperOptions: Array<{ id: WallpaperId; name: string; src: string }> = [
  { id: 'meadow', name: '晨光草原', src: './wallpapers/meadow.svg' },
  { id: 'mist', name: '雾山', src: './wallpapers/mist.svg' },
  { id: 'sunset', name: '晚霞', src: './wallpapers/sunset.svg' },
  { id: 'aurora', name: '极光', src: './wallpapers/aurora.svg' },
]

const workspaceNames: Record<WorkspaceId, string> = {
  work: '工作',
  study: '学习',
  life: '生活',
  focus: '专注',
}

type SectionId = 'general' | 'wallpaper' | 'appearance' | 'search' | 'data'
type WallpaperScope = 'global' | 'workspace'

interface Props {
  open: boolean
  initialSection?: SectionId
  settings: AppSettings
  state: PersistedState
  onChange: (settings: AppSettings) => void
  onImport: (state: PersistedState) => void
  onImportBookmarks: (bookmarks: ImportedBookmark[]) => void
  onReset: () => void
  onClose: () => void
}

export function SettingsPanel({ open, initialSection = 'general', settings, state, onChange, onImport, onImportBookmarks, onReset, onClose }: Props) {
  const [section, setSection] = useState<SectionId>(initialSection)
  const [wallpaperScope, setWallpaperScope] = useState<WallpaperScope>(
    state.workspaceAppearances?.[state.activeWorkspace] ? 'workspace' : 'global',
  )
  const [bookmarkStatus, setBookmarkStatus] = useState('')
  const [importingBookmarks, setImportingBookmarks] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [syncing, setSyncing] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const wallpaperRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const globalAppearance: WorkspaceAppearance = {
    wallpaper: settings.wallpaper,
    customWallpaper: settings.customWallpaper,
    wallpaperBlur: settings.wallpaperBlur,
    wallpaperShade: settings.wallpaperShade,
  }
  const workspaceAppearance = state.workspaceAppearances?.[state.activeWorkspace]
  const scopedAppearance = wallpaperScope === 'workspace'
    ? workspaceAppearance ?? globalAppearance
    : globalAppearance

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `weepwood-tab-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importData = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = JSON.parse(String(reader.result)) as PersistedState
        onImport(next)
      } catch {
        window.alert('无法读取该备份文件。')
      }
    }
    reader.readAsText(file)
  }

  const setWorkspaceAppearance = (appearance?: WorkspaceAppearance) => {
    const workspaceAppearances = { ...(state.workspaceAppearances ?? {}) }
    if (appearance) workspaceAppearances[state.activeWorkspace] = appearance
    else delete workspaceAppearances[state.activeWorkspace]
    onImport({
      ...state,
      workspaceAppearances: Object.keys(workspaceAppearances).length ? workspaceAppearances : undefined,
    })
  }

  const updateScopedAppearance = (patch: Partial<WorkspaceAppearance>) => {
    if (wallpaperScope === 'global') {
      onChange({
        ...settings,
        wallpaper: patch.wallpaper ?? settings.wallpaper,
        customWallpaper: 'customWallpaper' in patch ? patch.customWallpaper : settings.customWallpaper,
        wallpaperBlur: patch.wallpaperBlur ?? settings.wallpaperBlur,
        wallpaperShade: patch.wallpaperShade ?? settings.wallpaperShade,
      })
      return
    }

    setWorkspaceAppearance({
      ...(workspaceAppearance ?? globalAppearance),
      ...patch,
    })
  }

  const uploadWallpaper = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      window.alert('请选择图片文件。')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('本地壁纸请控制在 5MB 以内。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateScopedAppearance({ wallpaper: 'custom', customWallpaper: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const importBookmarks = async () => {
    setImportingBookmarks(true)
    setBookmarkStatus('正在读取浏览器书签…')
    try {
      const bookmarks = await readBrowserBookmarks()
      onImportBookmarks(bookmarks)
      setBookmarkStatus(`已导入 ${bookmarks.length} 个书签到当前工作空间`)
    } catch (error) {
      setBookmarkStatus(error instanceof Error ? error.message : '书签导入失败')
    } finally {
      setImportingBookmarks(false)
    }
  }

  const pushSync = async () => {
    setSyncing(true)
    setSyncStatus('正在上传同步数据…')
    try {
      await writeBrowserSync(state)
      setSyncStatus(`已上传 · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`)
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : '同步上传失败')
    } finally {
      setSyncing(false)
    }
  }

  const pullSync = async () => {
    setSyncing(true)
    setSyncStatus('正在读取同步数据…')
    try {
      const result = await readBrowserSync(state)
      onImport(result.state)
      setSyncStatus(`已恢复 · ${new Date(result.updatedAt).toLocaleString('zh-CN')}`)
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : '同步恢复失败')
    } finally {
      setSyncing(false)
    }
  }

  const removeSync = async () => {
    if (!window.confirm('确定删除浏览器账号中的 Weepwood Tab 同步备份吗？')) return
    setSyncing(true)
    try {
      await clearBrowserSync()
      setSyncStatus('浏览器同步备份已删除')
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : '删除同步备份失败')
    } finally {
      setSyncing(false)
    }
  }

  const switchRow = (title: string, detail: string, checked: boolean, onToggle: (checked: boolean) => void) => (
    <label className="setting-switch-row">
      <span><strong>{title}</strong><small>{detail}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
      <i />
    </label>
  )

  const dockPosition = settings.dockPosition ?? 'bottom'
  const customSearchName = settings.customSearchName ?? ''
  const customSearchUrl = settings.customSearchUrl ?? ''
  const syncAvailable = canUseBrowserSync()

  return (
    <div className="panel-backdrop settings-backdrop" onMouseDown={onClose}>
      <section className="settings-window" onMouseDown={(event) => event.stopPropagation()}>
        <aside className="settings-nav">
          <div className="settings-account">
            <span><Icon name="user" /></span>
            <div><strong>本地账户</strong><small>{syncAvailable ? '扩展版可使用浏览器同步' : '数据保存在当前浏览器'}</small></div>
          </div>
          <nav>
            <button className={section === 'general' ? 'active' : ''} onClick={() => setSection('general')}><Icon name="settings" />通用</button>
            <button className={section === 'wallpaper' ? 'active' : ''} onClick={() => setSection('wallpaper')}><Icon name="wallpaper" />壁纸</button>
            <button className={section === 'appearance' ? 'active' : ''} onClick={() => setSection('appearance')}><Icon name="layout" />外观</button>
            <button className={section === 'search' ? 'active' : ''} onClick={() => setSection('search')}><Icon name="search" />搜索</button>
            <button className={section === 'data' ? 'active' : ''} onClick={() => setSection('data')}><Icon name="download" />数据</button>
          </nav>
          <small className="settings-version">Weepwood Tab · v0.4</small>
        </aside>

        <main className="settings-content">
          <header><div><small>PERSONALIZE</small><h2>{section === 'general' ? '通用设置' : section === 'wallpaper' ? '壁纸' : section === 'appearance' ? '外观' : section === 'search' ? '搜索引擎' : '本地数据'}</h2></div><button onClick={onClose}><Icon name="close" /></button></header>

          {section === 'general' && (
            <div className="settings-page">
              <div className="setting-group">
                <h3>控制栏</h3>
                {switchRow('显示左侧栏', '保留主页、添加、编辑和设置入口', settings.showLeftRail, (checked) => onChange({ ...settings, showLeftRail: checked }))}
                {switchRow('显示 Dock', '展示最常用的网站入口', settings.showDock, (checked) => onChange({ ...settings, showDock: checked }))}
                {switchRow('Dock 放大效果', '悬停图标时使用轻微放大动画', settings.dockMagnify, (checked) => onChange({ ...settings, dockMagnify: checked }))}
                {switchRow('Dock 自动隐藏', '仅保留一条可触发的边缘区域', settings.dockAutoHide ?? false, (checked) => onChange({ ...settings, dockAutoHide: checked }))}
              </div>
              <div className="setting-group">
                <h3>Dock 位置</h3>
                <div className="segmented-control">
                  {([['bottom', '底部'], ['left', '左侧'], ['right', '右侧']] as Array<[DockPosition, string]>).map(([value, label]) => (
                    <button key={value} className={dockPosition === value ? 'active' : ''} onClick={() => onChange({ ...settings, dockPosition: value })}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="setting-group">
                <h3>时间</h3>
                {switchRow('显示秒数', '时钟每秒更新，耗电会略有增加', settings.showSeconds, (checked) => onChange({ ...settings, showSeconds: checked }))}
              </div>
            </div>
          )}

          {section === 'wallpaper' && (
            <div className="settings-page">
              <div className="setting-group wallpaper-scope-card">
                <div>
                  <h3>壁纸应用范围</h3>
                  <small>当前空间：{workspaceNames[state.activeWorkspace]}</small>
                </div>
                <div className="segmented-control">
                  <button className={wallpaperScope === 'global' ? 'active' : ''} onClick={() => setWallpaperScope('global')}>全部空间</button>
                  <button className={wallpaperScope === 'workspace' ? 'active' : ''} onClick={() => setWallpaperScope('workspace')}>当前空间</button>
                </div>
                {wallpaperScope === 'workspace' && workspaceAppearance && (
                  <button className="workspace-wallpaper-reset" onClick={() => setWorkspaceAppearance(undefined)}>恢复跟随全局</button>
                )}
              </div>

              <div className="wallpaper-grid">
                {wallpaperOptions.map((wallpaper) => (
                  <button key={wallpaper.id} className={scopedAppearance.wallpaper === wallpaper.id ? 'active' : ''} onClick={() => updateScopedAppearance({ wallpaper: wallpaper.id, customWallpaper: undefined })}>
                    <img src={wallpaper.src} alt="" /><span>{wallpaper.name}</span>{scopedAppearance.wallpaper === wallpaper.id && <Icon name="check" />}
                  </button>
                ))}
                <button className={scopedAppearance.wallpaper === 'custom' ? 'active custom-wallpaper-card' : 'custom-wallpaper-card'} onClick={() => wallpaperRef.current?.click()}>
                  {scopedAppearance.customWallpaper ? <img src={scopedAppearance.customWallpaper} alt="自定义壁纸" /> : <span className="upload-placeholder"><Icon name="upload" />上传本地壁纸</span>}
                  {scopedAppearance.wallpaper === 'custom' && <Icon name="check" />}
                </button>
                <input ref={wallpaperRef} hidden type="file" accept="image/*" onChange={(event) => uploadWallpaper(event.target.files?.[0])} />
              </div>
              <div className="setting-group compact-group">
                <label className="range-row"><span><strong>壁纸模糊</strong><small>{scopedAppearance.wallpaperBlur}px</small></span><input type="range" min="0" max="20" value={scopedAppearance.wallpaperBlur} onChange={(event) => updateScopedAppearance({ wallpaperBlur: Number(event.target.value) })} /></label>
                <label className="range-row"><span><strong>背景遮罩</strong><small>{scopedAppearance.wallpaperShade}%</small></span><input type="range" min="0" max="60" value={scopedAppearance.wallpaperShade} onChange={(event) => updateScopedAppearance({ wallpaperShade: Number(event.target.value) })} /></label>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="settings-page">
              <div className="setting-group">
                <h3>主题</h3>
                <div className="segmented-control">
                  {(['paper', 'midnight', 'aurora'] as const).map((theme) => <button key={theme} className={settings.theme === theme ? 'active' : ''} onClick={() => onChange({ ...settings, theme })}>{theme === 'paper' ? '浅色' : theme === 'midnight' ? '深色' : '彩色'}</button>)}
                </div>
              </div>
              <div className="setting-group">
                <h3>图标形状</h3>
                <div className="shape-options">
                  {(['squircle', 'rounded', 'circle'] as const).map((shape) => <button key={shape} className={settings.iconShape === shape ? 'active' : ''} onClick={() => onChange({ ...settings, iconShape: shape })}><span className={`shape-demo shape-${shape}`} />{shape === 'squircle' ? '拟态方形' : shape === 'rounded' ? '圆角方形' : '圆形'}</button>)}
                </div>
              </div>
              <div className="setting-group">
                {switchRow('玻璃卡片', '小组件使用半透明模糊效果', settings.glass, (checked) => onChange({ ...settings, glass: checked }))}
              </div>
            </div>
          )}

          {section === 'search' && (
            <div className="settings-page">
              <div className="setting-group">
                <h3>默认搜索引擎</h3>
                <div className="search-engine-list">
                  {([
                    ['bing', 'B', 'Bing'], ['google', 'G', 'Google'], ['baidu', '百', '百度'], ['duckduckgo', 'D', 'DuckDuckGo'],
                  ] as const).map(([id, mark, name]) => <button key={id} className={settings.searchEngine === id ? 'active' : ''} onClick={() => onChange({ ...settings, searchEngine: id })}><span>{mark}</span><strong>{name}</strong>{settings.searchEngine === id && <Icon name="check" />}</button>)}
                  {customSearchName.trim() && customSearchUrl.trim() && (
                    <button className={settings.searchEngine === 'custom' ? 'active' : ''} onClick={() => onChange({ ...settings, searchEngine: 'custom' })}><span>{customSearchName.slice(0, 1).toUpperCase()}</span><strong>{customSearchName}</strong>{settings.searchEngine === 'custom' && <Icon name="check" />}</button>
                  )}
                </div>
              </div>
              <div className="setting-group custom-search-settings">
                <h3>自定义搜索引擎</h3>
                <label><span>名称</span><input value={customSearchName} onChange={(event) => onChange({ ...settings, customSearchName: event.target.value })} placeholder="例如 GitHub" /></label>
                <label><span>搜索 URL</span><input value={customSearchUrl} onChange={(event) => onChange({ ...settings, customSearchUrl: event.target.value })} placeholder="https://example.com/search?q={query}" /></label>
                <small>使用 <code>{'{query}'}</code> 表示经过编码的搜索关键词；未填写占位符时会追加在 URL 末尾。</small>
              </div>
              <div className="setting-group">
                {switchRow('快捷方式建议', '输入时匹配本地网站入口', settings.showSearchSuggestions, (checked) => onChange({ ...settings, showSearchSuggestions: checked }))}
                {switchRow('搜索历史', '聚焦空搜索框时展示最近 8 条查询', settings.showSearchHistory ?? true, (checked) => onChange({ ...settings, showSearchHistory: checked }))}
              </div>
            </div>
          )}

          {section === 'data' && (
            <div className="settings-page">
              <div className="setting-group data-card">
                <Icon name="download" />
                <div><strong>导出完整备份</strong><small>包含布局、快捷方式、便签、待办和设置。</small></div>
                <button onClick={exportData}>导出</button>
              </div>
              <div className="setting-group data-card">
                <Icon name="upload" />
                <div><strong>导入备份</strong><small>导入后会覆盖当前浏览器中的数据。</small></div>
                <button onClick={() => importRef.current?.click()}>选择文件</button>
                <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => importData(event.target.files?.[0])} />
              </div>
              <div className={`setting-group data-card ${canImportBrowserBookmarks() ? '' : 'data-card-disabled'}`}>
                <Icon name="folder" />
                <div><strong>导入浏览器书签</strong><small>{canImportBrowserBookmarks() ? '最多读取 200 个网页书签，自动跳过重复网址。' : '仅在已安装的 Chrome/Edge 扩展版中可用。'}</small>{bookmarkStatus && <em>{bookmarkStatus}</em>}</div>
                <button disabled={!canImportBrowserBookmarks() || importingBookmarks} onClick={() => void importBookmarks()}>{importingBookmarks ? '读取中' : '导入'}</button>
              </div>
              <div className={`setting-group browser-sync-card ${syncAvailable ? '' : 'data-card-disabled'}`}>
                <div className="browser-sync-title">
                  <Icon name="refresh" />
                  <div><strong>浏览器账号同步</strong><small>{syncAvailable ? '同步轻量配置、布局和文字数据；本地图片不会上传。' : '仅在 Chrome/Edge 扩展版中可用。'}</small>{syncStatus && <em>{syncStatus}</em>}</div>
                </div>
                {switchRow('自动同步', '变更后自动写入浏览器账号同步空间', settings.browserSyncEnabled ?? false, (checked) => onChange({ ...settings, browserSyncEnabled: checked }))}
                <div className="sync-card-actions">
                  <button disabled={!syncAvailable || syncing} onClick={() => void pushSync()}>立即上传</button>
                  <button disabled={!syncAvailable || syncing} onClick={() => void pullSync()}>从同步恢复</button>
                  <button className="danger" disabled={!syncAvailable || syncing} onClick={() => void removeSync()}>删除云端备份</button>
                </div>
              </div>
              <button className="reset-data" onClick={() => { if (window.confirm('确定恢复默认布局和数据吗？')) onReset() }}><Icon name="trash" />恢复默认数据</button>
            </div>
          )}
        </main>
      </section>
    </div>
  )
}
