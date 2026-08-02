const week = ['一', '二', '三', '四', '五', '六', '日']

export function CalendarWidget({ now }: { now: Date }) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const start = firstDay === 0 ? 6 : firstDay - 1
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - start + 1
    return day > 0 && day <= days ? day : null
  })

  return (
    <article className="widget calendar-widget">
      <div className="widget-heading"><div><span className="eyebrow">CALENDAR</span><h3>{year} 年 {month + 1} 月</h3></div><span className="today-pill">今天 {now.getDate()}</span></div>
      <div className="calendar-grid">
        {week.map((day) => <span className="week-label" key={day}>{day}</span>)}
        {cells.map((day, index) => <span key={index} className={day === now.getDate() ? 'is-today' : ''}>{day}</span>)}
      </div>
    </article>
  )
}
