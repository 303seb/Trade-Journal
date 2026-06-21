import { getDayPnl, formatCurrency } from '../utils/stats'
import type { Trade } from '../types'

interface MonthCalendarProps {
  year: number
  month: number
  trades: Trade[]
  onDayClick: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthCalendar({ year, month, trades, onDayClick }: MonthCalendarProps) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const cells: (number | null)[] = [...Array(firstDay).fill(null)]
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Monthly Performance</h3>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />
          }
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
          const pnl = getDayPnl(trades, dateStr)
          const hasTrades = trades.some(t => t.date === dateStr)
          const isToday = dateStr === todayStr
          const isPositive = pnl > 0
          const isNegative = pnl < 0
          const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                relative rounded-lg p-1.5 min-h-[62px] flex flex-col items-center justify-start gap-1
                transition-all duration-150 group
                ${isToday ? 'ring-1 ring-violet-500' : ''}
                ${hasTrades && isPositive ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20' : ''}
                ${hasTrades && isNegative ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20' : ''}
                ${!hasTrades ? 'bg-[#0f1117] hover:bg-[#1a2035] border border-[#1e2535]' : ''}
                ${isWeekend && !hasTrades ? 'opacity-50' : ''}
              `}
            >
              <span
                className={`text-xs font-medium ${
                  isToday ? 'text-violet-400' : hasTrades ? 'text-white' : 'text-slate-500'
                }`}
              >
                {day}
              </span>
              {hasTrades && (
                <span
                  className={`text-[10px] font-bold leading-tight ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {pnl >= 0 ? '+' : ''}
                  {formatCurrency(pnl)}
                </span>
              )}
              {hasTrades && (
                <span className="text-[9px] text-slate-400">
                  {trades.filter(t => t.date === dateStr).length} trade
                  {trades.filter(t => t.date === dateStr).length !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
