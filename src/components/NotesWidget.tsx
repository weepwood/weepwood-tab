export function NotesWidget({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <article className="widget notes-widget">
      <div className="widget-heading"><div><span className="eyebrow">QUICK NOTE</span><h3>随手记</h3></div><span className="autosave">自动保存</span></div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="写下一条想法、链接或提醒…" />
    </article>
  )
}
