import { useRef } from 'react'
import type { AppSettings, PersistedState, ThemeId } from '../core/types'
import { Icon } from './Icon'

const themes: { id: ThemeId; name: string; colors: string[] }[] = [
  { id: 'midnight', name: '深夜蓝', colors: ['#101426', '#535bd4'] },
  { id: 'aurora', name: '极光', colors: ['#102a2e', '#b05076'] },
  { id: 'paper', name: '纸张', colors: ['#e8dfd1', '#8793ae'] },
]

export function SettingsDrawer({ settings, state, onChange, onClose, onImport, onReset }: { settings: AppSettings; state: PersistedState; onChange: (settings: AppSettings) => void; onClose: () => void; onImport: (state: PersistedState) => void; onReset: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `weepwood-tab-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importData = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { onImport(JSON.parse(String(reader.result)) as PersistedState) } catch { window.alert('无法读取该备份文件。') }
    }
    reader.readAsText(file)
  }

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="settings-drawer" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-header"><div><span className="eyebrow">PERSONALIZE</span><h2>个性化设置</h2></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div>
        <div className="settings-section"><h3>背景主题</h3><div className="theme-list">{themes.map((theme) => <button key={theme.id} className={settings.theme === theme.id ? 'active' : ''} onClick={() => onChange({ ...settings, theme: theme.id })}><span className="theme-preview" style={{ background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})` }} /><span>{theme.name}</span><span className="radio-dot" /></button>)}</div></div>
        <div className="settings-section"><h3>界面</h3><label className="switch-row"><span><strong>玻璃卡片</strong><small>使用半透明模糊效果</small></span><input type="checkbox" checked={settings.glass} onChange={(event) => onChange({ ...settings, glass: event.target.checked })} /></label><label className="switch-row"><span><strong>显示秒数</strong><small>时钟每秒更新</small></span><input type="checkbox" checked={settings.showSeconds} onChange={(event) => onChange({ ...settings, showSeconds: event.target.checked })} /></label><label className="switch-row"><span><strong>紧凑快捷方式</strong><small>一行展示更多入口</small></span><input type="checkbox" checked={settings.compactShortcuts} onChange={(event) => onChange({ ...settings, compactShortcuts: event.target.checked })} /></label></div>
        <div className="settings-section"><h3>本地数据</h3><div className="data-actions"><button className="secondary-button" onClick={exportData}><Icon name="download" />导出备份</button><button className="secondary-button" onClick={() => inputRef.current?.click()}><Icon name="upload" />导入备份</button><input ref={inputRef} type="file" accept="application/json" hidden onChange={(event) => importData(event.target.files?.[0])} /></div><button className="danger-button" onClick={() => { if (window.confirm('确定恢复默认数据吗？此操作不可撤销。')) onReset() }}><Icon name="trash" />恢复默认数据</button></div>
        <p className="privacy-note">当前版本的快捷方式、任务、便签与设置仅保存在本机浏览器中。</p>
      </aside>
    </div>
  )
}
