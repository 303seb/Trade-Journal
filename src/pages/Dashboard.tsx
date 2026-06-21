import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, TrendingUp, DollarSign, BarChart2, Award } from 'lucide-react'
import { StatCard } from '../components/StatCard'
import { IncomeGoal } from '../components/IncomeGoal'
import { MonthCalendar } from '../components/MonthCalendar'
import { TradeModal } from '../components/TradeModal'
import { DayTradesDrawer } from '../components/DayTradesDrawer'
import {
  getMonthTrades,
  calcNetPnl,
  calcWinRate,
  calcProfitFactor,
  getDayPnl,
  formatCurrency,
  formatPct,
} from '../utils/stats'
import type { Trade } from '../types'

interface DashboardProps {
  trades: Trade[]
  monthlyGoals: { month: string; amount: number }[]
  onAddTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => void
  onDeleteTrade: (id: string) => void
  onSetGoal: (month: string, amount: number) => void
}

export function Dashboard({ trades, monthlyGoals, onAddTrade, onDeleteTrade, onSetGoal }: DashboardProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [defaultDate, setDefaultDate] = useState<string | undefined>()

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const monthTrades = getMonthTrades(trades, year, month)
  const netPnl = calcNetPnl(monthTrades)
  const winRate = calcWinRate(monthTrades)
  const profitFactor = calcProfitFactor(monthTrades)
  const todayPnl = getDayPnl(trades, todayStr)
  const goalAmount = monthlyGoals.find(g => g.month === monthStr)?.amount ?? 0

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const selectedDateTrades = selectedDate ? trades.filter(t => t.date === selectedDate) : []

  return (
    <div className="flex flex-col gap-5 p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-[#161b27] border border-[#1e2535] text-slate-400 hover:text-white hover:border-violet-500 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <h1 className="text-xl font-bold text-white">{monthLabel}</h1>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-[#161b27] border border-[#1e2535] text-slate-400 hover:text-white hover:border-violet-500 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={() => { setDefaultDate(undefined); setShowTradeModal(true) }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Add Trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Net P&L"
          value={formatCurrency(netPnl)}
          sub={`${monthTrades.length} trades`}
          positive={monthTrades.length === 0 ? null : netPnl >= 0}
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label="Today's P&L"
          value={formatCurrency(todayPnl)}
          sub="current day"
          positive={todayPnl === 0 ? null : todayPnl > 0}
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Profit Factor"
          value={profitFactor >= 999 ? '∞' : profitFactor.toFixed(2)}
          sub={profitFactor >= 1 ? 'Profitable' : 'Unprofitable'}
          positive={monthTrades.length === 0 ? null : profitFactor >= 1}
          icon={<BarChart2 size={16} />}
        />
        <StatCard
          label="Win Rate"
          value={formatPct(winRate)}
          sub={`${monthTrades.filter(t => t.pnl > 0).length}W / ${monthTrades.filter(t => t.pnl < 0).length}L`}
          positive={monthTrades.length === 0 ? null : winRate >= 50}
          icon={<Award size={16} />}
        />
      </div>

      {/* Income Goal */}
      <IncomeGoal
        month={monthStr}
        currentPnl={netPnl}
        goal={goalAmount}
        onSetGoal={amount => onSetGoal(monthStr, amount)}
      />

      {/* Calendar */}
      <MonthCalendar
        year={year}
        month={month}
        trades={trades}
        onDayClick={date => {
          setSelectedDate(date)
          setDefaultDate(date)
        }}
      />

      {/* Modals */}
      {showTradeModal && (
        <TradeModal
          defaultDate={defaultDate}
          onSave={onAddTrade}
          onClose={() => setShowTradeModal(false)}
        />
      )}
      {selectedDate && (
        <DayTradesDrawer
          date={selectedDate}
          trades={selectedDateTrades}
          onClose={() => setSelectedDate(null)}
          onDelete={id => {
            onDeleteTrade(id)
            if (selectedDateTrades.length <= 1) setSelectedDate(null)
          }}
        />
      )}
    </div>
  )
}
