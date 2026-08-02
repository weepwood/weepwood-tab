import { useEffect, useMemo, useState } from 'react'

export function useClock(showSeconds: boolean) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), showSeconds ? 1000 : 30_000)
    return () => window.clearInterval(timer)
  }, [showSeconds])

  return useMemo(() => {
    const time = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: false,
    }).format(now)
    const date = new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(now)
    return { now, time, date }
  }, [now, showSeconds])
}
