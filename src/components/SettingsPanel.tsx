import { useRef, useState } from 'react'
import type { AppSettings, PersistedState, WallpaperId } from '../core/types'
import { Icon } from './Icon'

const wallpaperOptions: Array<{ id: WallpaperId; name: string; src: string }> = [
  { id: 'meadow', name: '晨光草原', src: './wallpapers/meadow.svg' },
  { id: 'mist', name: '雾山', src: './wallpapers/mist.svg' },
  { id: 'sunset', name: '晚霞', src: './wallpapers/sunset.svg' },
  { id: 'aurora', name: '极光', src: './wallpapers/aurora.svg' },
]

type SectionId = 'general' | 'wallpaper' | 'appearance' | 'search' | 'data'

interface Props {
  open: boolean
  initialSection?: SectionId
  settings: AppSettings
  state: PersistedState
  onChange: (settings: AppSettings) => void
  onImport: (state: PersistedState) => void
  onReset: () => void
  onClose: () => void
}

export function SettingsPanel({ open, initialSection = 'general', settings, state, onChange, onImport, onReset, onClose }: Props) {
  const [section, setSection] = useState<SectionId>(initialSection)
  const importRef = useRef<HTMLInputElement>(null)
  const wallpaperRef = useRef<HTMLInputElement>(null)

  if (!open) return null

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
    reader.onload = () => onChange({ ...settings, wallpaper: 'custom', customWallpaper: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const switchRow = (title: string, detail: string, checked: boolean, onToggle: (checked: boolean) => void) => (
    <label className="setting-switch-row">
      <span><strong>{title}</strong><small>{detail}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
      <i />
    </label>
  )

  return (
    <div className="panel-backdrop settings-backdrop" onMouseDown={onClose}>
      <section className="settings-window" onMouseDown={(event) => event.stopPropagation()}>
        <aside className="settings-nav">
          <div className="settings-account"><span><Icon name="user" /></span><div><strong>本地账户</strong><small>数据保存在当前浏览器</small></div></div>
          <nav>
            <button className={section === 'general' ? 'active' : ''} onClick={() => setSection('general')}><Icon name="settings" />通用</button>
            <button className={section === 'wallpaper' ? 'active' : ''} onClick={() => setSection('wallpaper')}><Icon name="wallpaper" />壁纸</button>
            <button className={section === 'appearance' ? 'active' : ''} onClick={() => setSection('appearance')}><Icon name="layout" />外观</button>
            <button className={section === 'search' ? 'active' : ''} onClick={() => setSection('search')}><Icon name="search" />搜索</button>
            <button className={section === 'data' ? 'active' : ''} onClick={() => setSection('data')}><Icon name="download" />数据</button>
          </nav>
          <small className="settings-version">Weepwood Tab · v0.2</small>
        </aside>

        <main className="settings-content">
          <header><div><small>PERSONALIZE</small><h2>{section === 'general' ? '通用设置' : section === 'wallpaper' ? '壁纸' : section === 'appearance' ? '外观' : section === 'search' ? '搜索引擎' : '本地数据'}</h2></div><button onClick={onClose}><Icon name="close" /></button></header>

          {section === 'general' && (
            <div className="settings-page">
              <div className="setting-group">
                <h3>控制栏</h3>
                {switchRow('显示左侧栏', '保留主页、添加、编辑和设置入口', settings.showLeftRail, (checked) => onChange({ ...settings, showLeftRail: checked }))}
                {switchRow('显示底部 Dock', '在页面底部展示最常用的网站', settings.showDock, (checked) => onChange({ ...settings, showDock: checked }))}
                {switchRow('Dock 放大效果', '悬停图标时使用轻微放大动画', settings.dockMagnify, (checked) => onChange({ ...settings, dockMagnify: checked }))}
              </div>
              <div className="setting-group">
                <h3>时间</h3>
                {switchRow('显示秒数', '时钟每秒更新，耗电会略有增加', settings.showSeconds, (checked) => onChange({ ...settings, showSeconds: checked }))}
              </div>
            </div>
          )}

          {section === 'wallpaper' && (
            <div className="settings-page">
              <div className="wallpaper-grid">
                {wallpaperOptions.map((wallpaper) => (
                  <button key={wallpaper.id} className={settings.wallpaper === wallpaper.id ? 'active' : ''} onClick={() => onChange({ ...settings, wallpaper: wallpaper.id })}>
                    <img src={wallpaper.src} alt="" /><span>{wallpaper.name}</span>{settings.wallpaper === wallpaper.id && <Icon name="check" />}
                  </button>
                ))}
                <button className={settings.wallpaper === 'custom' ? 'active custom-wallpaper-card' : 'custom-wallpaper-card'} onClick={() => wallpaperRef.current?.click()}>
                  {settings.customWallpaper ? <img src={settings.customWallpaper} alt="自定义壁纸" /> : <span className="upload-placeholder"><Icon name="upload" />上传本地壁纸</span>}
                  {settings.wallpaper === 'custom' && <Icon name="check" />}
                </button>
                <input ref={wallpaperRef} hidden type="file" accept="image/*" onChange={(event) => uploadWallpaper(event.target.files?.[0])} />
              </div>
              <div className="setting-group compact-group">
                <label className="range-row"><span><strong>壁纸模糊</strong><small>{settings.wallpaperBlur}px</small></span><input type="range" min="0" max="20" value={settings.wallpaperBlur} onChange={(event) => onChange({ ...settings, wallpaperBlur: Number(event.target.value) })} /></label>
                <label className="range-row"><span><strong>背景遮罩</strong><small>{settings.wallpaperShade}%</small></span><input type="range" min="0" max="60" value={settings.wallpaperShade} onChange={(event) => onChange({ ...settings, wallpaperShade: Number(event.target.value) })} /></label>
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
                </div>
              </div>
              <div className="setting-group">
                {switchRow('快捷方式建议', '输入时匹配本地网站入口', settings.showSearchSuggestions, (checked) => onChange({ ...settings, showSearchSuggestions: checked }))}
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
              <button className="reset-data" onClick={() => { if (window.confirm('确定恢复默认布局和数据吗？')) onReset() }}><Icon name="trash" />恢复默认数据</button>
            </div>
          )}
        </main>
      </section>
    </div>
  )
}
