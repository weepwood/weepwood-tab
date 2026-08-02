import { useRef, useState } from 'react'
import type { ShortcutIconMode } from '../core/types'
import { readIconFile } from '../utils/iconImage'
import { Icon } from './Icon'
import '../styles/icon-upload.css'

interface Props {
  mode: ShortcutIconMode
  imageUrl?: string
  onModeChange: (mode: ShortcutIconMode) => void
  onImageChange: (value?: string) => void
}

export function ShortcutIconPicker({ mode, imageUrl, onModeChange, onImageChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="shortcut-icon-picker">
      <div className="icon-mode-tabs" role="group" aria-label="图标来源">
        <button type="button" className={mode === 'auto' ? 'active' : ''} onClick={() => onModeChange('auto')}>网页图标</button>
        <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => onModeChange('image')}>上传图片</button>
        <button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => onModeChange('text')}>文字图标</button>
      </div>

      {mode === 'auto' && <p>自动读取网站 favicon，并缓存成功的图标来源。</p>}

      {mode === 'image' && (
        <div className="icon-upload-row">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}>
            <Icon name="upload" />
            {loading ? '正在处理…' : imageUrl ? '更换图片' : '选择图片'}
          </button>
          <span>{imageUrl ? '图片已压缩并保存在本地数据中' : '支持 PNG、JPG、WebP、SVG，最大 4MB'}</span>
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

      {error && <span className="icon-upload-error">{error}</span>}
    </div>
  )
}
