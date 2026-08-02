import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from './Icon'

const DEFAULT_SECONDS = 25 * 60

export function FocusWidget() {
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = (seconds % 60).toString().padStart(2, '0')
  const progress = 1 - seconds / DEFAULT_SECONDS

  return (
    <article className="widget focus-widget">
      <div className="widget-heading"><div><span className="eyebrow">FOCUS</span><h3>专注计时</h3></div><Icon name="sparkles" className="accent-icon" /></div>
      <div className="timer-ring" style={{ '--progress': `${progress * 360}deg` } as CSSProperties}><div><strong>{minutes}:{remainder}</strong><span>{running ? '保持专注' : seconds === 0 ? '本轮完成' : '准备开始'}</span></div></div>
      <div className="timer-actions"><button className="primary-button small" onClick={() => setRunning(!running)}><Icon name={running ? 'pause' : 'play'} />{running ? '暂停' : '开始'}</button><button className="secondary-button small" onClick={() => { setRunning(false); setSeconds(DEFAULT_SECONDS) }}><Icon name="reset" />重置</button></div>
    </article>
  )
}
