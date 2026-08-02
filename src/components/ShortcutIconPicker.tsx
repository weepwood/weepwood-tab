import { useMemo, useRef, useState } from 'react'
import type { ShortcutIconFit, ShortcutIconMode } from '../core/types'
import { readIconFile } from '../utils/iconImage'
import { clearFaviconCache, getFaviconCandidates } from './ShortcutIcon'
import { Icon } from './Icon'
import '../styles/icon-upload.css'

interface Props {
  mode: ShortcutIconMode
  shortcutUrl: string
  imageUrl?: string
  fit: ShortcutIconFit
  padding: number
  background: string
  onModeChange: (mode: ShortcutIconMode) => void
  onImageChange: (value?: string) => void
  onFitChange: (value: ShortcutIconFit) => void
  onPaddingChange: (value: number) => void
  onBackgroundChange: (value: string) => void
}

export function ShortcutIconPicker({
  mode,
  shortcutUrl,
  imageUrl,
  fit,
  padding,
  background,
  onModeChange,
  onImageChange,
  onFitChange,
  onPaddingChange,
  onBackgroundChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [candidateVersion, setCandidateVersion] = useState(0)
  const candidates = useMemo(() => getFaviconCandidates(shortcutUrl, mode === 'auto' ? imageUrl : undefined), [candidateVersion, imageUrl, mode, shortcutUrl])

  const selectFile = async (file?: File) => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const value = await readIconFile(file)
      onImageChange(value)
      onModeChange('image')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '图标处理失败')
    } finally {
      setLoading(false)
    }
  }

  const refreshCandidates = () => {
    clearFaviconCache(shortcutUrl)
    onImageChange(undefined)
    setCandidateVersion((value) => value + 1)
  }

  const showAppearance = mode !== 'text'

  return (
    <div className="shortcut-icon-picker shortcut-icon-picker-deep">
      <div className="icon-mode-tabs" role="group" aria-label="图标来源">
        <button type="button" className={mode === 'auto' ? 'active' : ''} onClick={() => onModeChange('auto')}>自动获取</button>
        <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => onModeChange('image')}>上传图片</button>
        <button type="button" className={mode === 'url' ? 'active' : ''} onClick={() => onModeChange('url')}>图片网址</button>
        <button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => onModeChange('text')}>文字图标</button>
      </div>

      {mode === 'auto' && (
        <div className="favicon-candidate-section">
          <div className="favicon-candidate-header">
            <div><strong>自动图标候选</strong><small>按顺序尝试，点击可固定优先来源</small></div>
            <button type="button" onClick={refreshCandidates}><Icon name="refresh" />重新探测</button>
          </div>
          {candidates.length > 0 ? (
            <div className="favicon-candidate-grid">
              {candidates.slice(0, 9).map((candidate) => (
                <button
                  key={`${candidate.id}-${candidate.url}`}
                  type="button"
                  className={imageUrl === candidate.url ? 'active' : ''}
                  onClick={() => onImageChange(candidate.url)}
                  title={candidate.url}
                >
                  <span><img src={candidate.url} alt="" referrerPolicy="no-referrer" /></span>
                  <small>{candidate.label}</small>
                  {imageUrl === candidate.url && <Icon name="check" />}
                </button>
              ))}
            </div>
          ) : <p>该链接不是普通网页，将使用文字图标；也可以上传图片或填写图片网址。</p>}
        </div>
      )}

      {mode === 'image' && (
        <div className="icon-upload-row">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
            <Icon name="upload" />
            {loading ? '正在处理…' : imageUrl?.startsWith('data:') ? '更换图片' : '选择图片'}
          </button>
          <span>{imageUrl?.startsWith('data:') ? '图片已压缩并保存在当前浏览器' : '支持 PNG、JPG、WebP、SVG，最大 4MB'}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              void selectFile(event.target.files?.[0])
              event.currentTarget.value = ''
            }}
          />
        </div>
      )}

      {mode === 'url' && (
        <label className="remote-icon-field">
          <span>图片地址</span>
          <input value={imageUrl ?? ''} onChange={(event) => onImageChange(event.target.value.trim() || undefined)} placeholder="https://example.com/icon.png" />
          <small>适合使用自建图床、CDN 或固定品牌图标。请使用 HTTPS 图片地址。</small>
        </label>
      )}

      {showAppearance && (
        <div className="icon-appearance-settings">
          <div className="icon-fit-setting">
            <span>图片显示</span>
            <div className="segmented-control">
              <button type="button" className={fit === 'contain' ? 'active' : ''} onClick={() => onFitChange('contain')}>完整显示</button>
              <button type="button" className={fit === 'cover' ? 'active' : ''} onClick={() => onFitChange('cover')}>铺满裁切</button>
            </div>
          </div>
          <label className="icon-padding-setting">
            <span>图标留白 <small>{padding}px</small></span>
            <input type="range" min="0" max="20" value={padding} onChange={(event) => onPaddingChange(Number(event.target.value))} />
          </label>
          <div className="icon-background-setting">
            <span>图标背景</span>
            <div>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(background) ? background : '#ffffff'} onChange={(event) => onBackgroundChange(event.target.value)} />
              <button type="button" className={background === 'transparent' ? 'active' : ''} onClick={() => onBackgroundChange('transparent')}>透明</button>
            </div>
          </div>
        </div>
      )}

      {error && <span className="icon-upload-error">{error}</span>}
    </div>
  )
}
