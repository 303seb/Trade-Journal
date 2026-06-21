import { useState } from 'react'
import { X } from 'lucide-react'
import type { Trade } from '../types'

interface TradeModalProps {
  defaultDate?: string
  onSave: (trade: Omit<Trade, 'id' | 'createdAt'>) => void
  onClose: () => void
}

export function TradeModal({ defaultDate, onSave, onClose }: TradeModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: defaultDate || today,
    symbol: '',
    side: 'Long' as Trade['side'],
    contracts: '1',
    entryPrice: '',
    exitPrice: '',
    notes: '',
  })

  const pnl = (() => {
    const entry = parseFloat(form.entryPrice)
    const exit = parseFloat(form.exitPrice)
    const qty = parseFloat(form.contracts)
    if (isNaN(entry) || isNaN(exit) || isNaN(qty)) return null
    const diff = form.side === 'Long' ? exit - entry : entry - exit
    return diff * qty
  })()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.symbol || !form.entryPrice || !form.exitPrice) return
    onSave({
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      contracts: parseFloat(form.contracts) || 1,
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
      pnl: pnl ?? 0,
      notes: form.notes,
    })
    onClose()
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#161b27] border border-[#1e2535] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1e2535]">
          <h2 className="text-base font-semibold text-white">Add Trade</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={set('date')}
                className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Symbol</label>
              <input
                type="text"
                placeholder="ES, NQ, MES..."
                value={form.symbol}
                onChange={set('symbol')}
                className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 transition-colors uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Side</label>
              <select
                value={form.side}
                onChange={set('side')}
                className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 transition-colors"
              >
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Contracts / Qty</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.contracts}
                onChange={set('contracts')}
                className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Entry Price</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.entryPrice}
                onChange={set('entryPrice')}
                className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Exit Price</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.exitPrice}
                onChange={set('exitPrice')}
                className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 transition-colors"
                required
              />
            </div>
          </div>

          {pnl !== null && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-center ${
              pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              P&L: {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
            <textarea
              placeholder="Trade setup, mistakes, observations..."
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full bg-[#0f1117] border border-[#2d3748] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1e2535] hover:bg-[#252e42] text-slate-300 rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              Save Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
