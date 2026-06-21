import { useState, useEffect } from 'react'
import { Target, Edit2, Check } from 'lucide-react'
import { formatCurrency } from '../utils/stats'

interface IncomeGoalProps {
  month: string
  currentPnl: number
  goal: number
  onSetGoal: (amount: number) => void
}

export function IncomeGoal({ month, currentPnl, goal, onSetGoal }: IncomeGoalProps) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(goal.toString())

  useEffect(() => {
    setInputVal(goal.toString())
  }, [goal])

  const progress = goal > 0 ? Math.min((currentPnl / goal) * 100, 100) : 0
  const remaining = goal - currentPnl
  const isAhead = currentPnl >= goal

  const handleSave = () => {
    const parsed = parseFloat(inputVal.replace(/[^0-9.-]/g, ''))
    if (!isNaN(parsed) && parsed > 0) onSetGoal(parsed)
    setEditing(false)
  }

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-[#161b27] border border-[#1e2535] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-violet-400" />
          <span className="text-sm font-semibold text-white">Monthly Income Goal</span>
          <span className="text-xs text-slate-500">— {monthLabel}</span>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">$</span>
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-1 text-sm text-white w-32 focus:border-violet-500"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg p-1.5 transition-colors"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors"
          >
            <Edit2 size={13} />
            {goal > 0 ? `Goal: ${formatCurrency(goal)}` : 'Set goal'}
          </button>
        )}
      </div>

      {goal > 0 ? (
        <>
          <div className="relative h-3 bg-[#1e2535] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAhead
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-violet-600 to-violet-400'
              }`}
              style={{ width: `${Math.max(progress, 0)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={isAhead ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {isAhead
                ? `+${formatCurrency(currentPnl - goal)} over goal`
                : `${formatCurrency(remaining)} remaining`}
            </span>
            <span className={`font-semibold ${isAhead ? 'text-emerald-400' : 'text-violet-400'}`}>
              {progress.toFixed(1)}%
            </span>
          </div>
        </>
      ) : (
        <div className="text-xs text-slate-500 text-center py-2">
          Set a monthly income goal to track your progress
        </div>
      )}
    </div>
  )
}
