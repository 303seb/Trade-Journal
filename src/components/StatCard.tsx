interface StatCardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean | null
  icon: React.ReactNode
}

export function StatCard({ label, value, sub, positive, icon }: StatCardProps) {
  const valueColor =
    positive === null || positive === undefined
      ? 'var(--text)'
      : positive
      ? '#4ade80'
      : '#f87171'

  const accentColor =
    positive === null || positive === undefined
      ? 'var(--border-mid)'
      : positive
      ? 'rgba(74,222,128,0.5)'
      : 'rgba(248,113,113,0.5)'

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 14,
        padding: '18px 18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </span>
        <span style={{ color: 'var(--border-strong)' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: valueColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 7 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}
