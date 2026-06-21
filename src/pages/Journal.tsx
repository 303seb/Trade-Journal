import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, Save, Plus, Trash2, BookOpen, ImageIcon, X,
} from 'lucide-react'
import type { JournalEntry, TradeLog, TradeResult, Emotion } from '../types'

// ── Utilities ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatShort(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function emptyEntry(date: string): JournalEntry {
  return {
    id: uid(),
    date,
    premktImgKey: undefined,
    premktAnalysis: '',
    trades: [],
    emotion: undefined,
    postMarketNotes: '',
    updatedAt: '',
  }
}

function emptyTrade(): TradeLog {
  return { id: uid(), result: 'Win', entryPrice: '', exitPrice: '', confluences: [] }
}

function safeEntry(raw: unknown, date: string): JournalEntry {
  const base = emptyEntry(date)
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Record<string, unknown>
  return {
    ...base,
    id: typeof r.id === 'string' ? r.id : base.id,
    premktAnalysis: typeof r.premktAnalysis === 'string' ? r.premktAnalysis : '',
    postMarketNotes: typeof r.postMarketNotes === 'string' ? r.postMarketNotes : '',
    emotion: (r.emotion as Emotion | undefined) ?? undefined,
    premktImgKey: typeof r.premktImgKey === 'string' ? r.premktImgKey : undefined,
    trades: Array.isArray(r.trades)
      ? (r.trades as TradeLog[]).map(t => ({ ...emptyTrade(), ...t }))
      : [],
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : '',
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RESULTS: { value: TradeResult; label: string; bg: string; border: string; text: string }[] = [
  { value: 'Win',   label: 'Win',   bg: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-300' },
  { value: 'Loss',  label: 'Loss',  bg: 'bg-red-500/20',     border: 'border-red-400',     text: 'text-red-300'     },
  { value: 'BE',    label: 'BE',    bg: 'bg-slate-500/20',   border: 'border-slate-400',   text: 'text-slate-200'   },
  { value: 'Faded', label: 'Faded', bg: 'bg-violet-500/20',  border: 'border-violet-400',  text: 'text-violet-300'  },
]

const EMOTIONS: { value: Emotion; emoji: string; label: string }[] = [
  { value: 'very_happy',  emoji: '😄', label: 'Very Happy'  },
  { value: 'happy',       emoji: '🙂', label: 'Happy'       },
  { value: 'neutral',     emoji: '😐', label: 'Neutral'     },
  { value: 'frustrated',  emoji: '😕', label: 'Frustrated'  },
  { value: 'angry',       emoji: '😤', label: 'Angry'       },
  { value: 'very_angry',  emoji: '😡', label: 'Very Angry'  },
]

// ── Chart Upload ──────────────────────────────────────────────────────────────

function ChartUpload({
  preview, onFile, onClear,
}: {
  preview: string | null
  onFile: (dataUrl: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result
      if (typeof result === 'string') onFile(result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-[#2d3748] group">
          <img src={preview} alt="chart" className="w-full max-h-64 object-contain bg-black" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-[#2d3748] hover:border-violet-500/60 rounded-xl p-10 flex flex-col items-center gap-2 cursor-pointer transition-colors"
        >
          <ImageIcon size={24} className="text-slate-600" />
          <span className="text-sm text-slate-500">Click or drag a chart screenshot here</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ── Trade Card ────────────────────────────────────────────────────────────────

function TradeCard({
  trade, allTags, onUpdate, onRemove, onAddTag,
}: {
  trade: TradeLog
  allTags: string[]
  onUpdate: (t: TradeLog) => void
  onRemove: () => void
  onAddTag: (tag: string) => void
}) {
  const [newTag, setNewTag] = useState('')

  const set = <K extends keyof TradeLog>(k: K, v: TradeLog[K]) => onUpdate({ ...trade, [k]: v })

  const toggleConfluence = (tag: string) => {
    const next = trade.confluences.includes(tag)
      ? trade.confluences.filter(t => t !== tag)
      : [...trade.confluences, tag]
    set('confluences', next)
  }

  const addTag = () => {
    const t = newTag.trim()
    if (!t) return
    onAddTag(t)
    if (!trade.confluences.includes(t)) set('confluences', [...trade.confluences, t])
    setNewTag('')
  }

  return (
    <div className="rounded-2xl border border-[#252d3d] bg-[#111520] p-5 flex flex-col gap-4">
      {/* Result + delete */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {RESULTS.map(r => {
            const active = trade.result === r.value
            return (
              <button
                key={r.value}
                onClick={() => set('result', r.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  active
                    ? `${r.bg} ${r.border} ${r.text}`
                    : 'border-[#2d3748] text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>
        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors ml-2">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Entry Price</label>
          <input
            type="number"
            value={trade.entryPrice}
            onChange={e => set('entryPrice', e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0d1117] border border-[#2d3748] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Exit Price</label>
          <input
            type="number"
            value={trade.exitPrice}
            onChange={e => set('exitPrice', e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0d1117] border border-[#2d3748] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Confluences */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">Confluences</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleConfluence(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                trade.confluences.includes(tag)
                  ? 'bg-violet-500/20 border-violet-400/60 text-violet-300'
                  : 'border-[#2d3748] text-slate-500 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Add confluence tag…"
            className="flex-1 bg-[#0d1117] border border-[#2d3748] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-violet-500 transition-colors"
          />
          <button
            onClick={addTag}
            className="bg-[#1e2535] hover:bg-[#252e42] text-slate-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Journal ──────────────────────────────────────────────────────────────

interface JournalProps {
  entries: JournalEntry[]
  confluenceTags: string[]
  onSave: (entry: JournalEntry) => void
  onAddConfluenceTag: (tag: string) => void
  onDeleteConfluenceTag: (tag: string) => void
}

export function Journal({ entries, confluenceTags, onSave, onAddConfluenceTag }: JournalProps) {
  const TODAY = todayStr()
  const [date, setDate] = useState(TODAY)
  const [form, setForm] = useState<JournalEntry>(() =>
    safeEntry(entries.find(e => e.date === TODAY), TODAY)
  )
  const [chartPreview, setChartPreview] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Load entry when date changes
  useEffect(() => {
    const found = entries.find(e => e.date === date)
    const entry = safeEntry(found, date)
    setForm(entry)
    // Restore chart preview from entry if it has base64 stored
    setChartPreview(entry.premktImgKey?.startsWith('data:') ? entry.premktImgKey : null)
    setSaved(false)
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  const patch = <K extends keyof JournalEntry>(k: K, v: JournalEntry[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const save = () => {
    const toSave = { ...form, updatedAt: new Date().toISOString() }
    onSave(toSave)
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const prev = () => setDate(d => shiftDate(d, -1))
  const next = () => { const n = shiftDate(date, 1); if (n <= TODAY) setDate(n) }

  // Chart: store as base64 directly on entry (no IndexedDB needed)
  const handleChartFile = (dataUrl: string) => {
    setChartPreview(dataUrl)
    patch('premktImgKey', dataUrl) // reuse field to store base64
  }
  const clearChart = () => {
    setChartPreview(null)
    patch('premktImgKey', undefined)
  }

  // Trades
  const addTrade = () => patch('trades', [...form.trades, emptyTrade()])
  const updateTrade = (i: number, t: TradeLog) =>
    patch('trades', form.trades.map((x, idx) => idx === i ? t : x))
  const removeTrade = (i: number) =>
    patch('trades', form.trades.filter((_, idx) => idx !== i))

  const sidebarEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0a0d13', borderRight: '1px solid #1e2535', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2535', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={14} color="#8b5cf6" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>Daily Journal</span>
        </div>
        <button
          onClick={() => setDate(TODAY)}
          style={{
            textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid #1e2535',
            background: date === TODAY ? 'rgba(139,92,246,0.1)' : 'transparent',
            color: date === TODAY ? '#c4b5fd' : '#94a3b8',
            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
          }}
        >
          Today
        </button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sidebarEntries.map(e => {
            const em = EMOTIONS.find(x => x.value === e.emotion)
            return (
              <button
                key={e.date}
                onClick={() => setDate(e.date)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 16px',
                  borderBottom: '1px solid #1e2535',
                  background: date === e.date ? 'rgba(139,92,246,0.1)' : 'transparent',
                  color: date === e.date ? '#c4b5fd' : '#94a3b8',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{formatShort(e.date)}</div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                    {e.trades.length} trade{e.trades.length !== 1 ? 's' : ''}
                  </div>
                </div>
                {em && <span style={{ fontSize: 16 }}>{em.emoji}</span>}
              </button>
            )
          })}
          {sidebarEntries.length === 0 && (
            <p style={{ fontSize: 11, color: '#374151', textAlign: 'center', padding: 16 }}>No entries yet</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#0d1117', borderBottom: '1px solid #1e2535' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={prev} className="p-1.5 rounded-lg bg-[#161b27] border border-[#2d3748] text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={15} />
            </button>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{formatDate(date)}</div>
              {date === TODAY && <div style={{ fontSize: 10, color: '#8b5cf6' }}>Today</div>}
            </div>
            <button
              onClick={next}
              disabled={date >= TODAY}
              className="p-1.5 rounded-lg bg-[#161b27] border border-[#2d3748] text-slate-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <button
            onClick={save}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
              borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: saved ? 'rgba(16,185,129,0.2)' : '#7c3aed',
              color: saved ? '#6ee7b7' : '#fff',
              outline: saved ? '1px solid rgba(16,185,129,0.4)' : 'none',
            }}
          >
            <Save size={14} />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* ─── PREMARKET ANALYSIS ─────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8b5cf6' }}>Premarket Analysis</span>
              <div style={{ flex: 1, height: 1, background: '#1e2535' }} />
            </div>

            <div className="rounded-2xl border border-[#1e2535] bg-[#0d1117] p-5 flex flex-col gap-4">
              <ChartUpload
                preview={chartPreview}
                onFile={handleChartFile}
                onClear={clearChart}
              />
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Daily Analysis</label>
                <textarea
                  value={form.premktAnalysis}
                  onChange={e => patch('premktAnalysis', e.target.value)}
                  rows={5}
                  placeholder="Key levels, bias, market structure, what you're watching today…"
                  style={{ width: '100%', background: '#161b27', border: '1px solid #2d3748', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#e2e8f0', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={e => (e.target.style.borderColor = '#2d3748')}
                />
              </div>
            </div>
          </section>

          {/* ─── TRADE JOURNAL ──────────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8b5cf6' }}>Trade Journal</span>
              <div style={{ flex: 1, height: 1, background: '#1e2535' }} />
              <button
                onClick={addTrade}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={13} /> Add Trade
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {form.trades.length === 0 && (
                <div style={{ background: '#0d1117', border: '2px dashed #252d3d', borderRadius: 16, padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#4b5563', fontSize: 14 }}>No trades logged yet — click Add Trade above</p>
                </div>
              )}
              {form.trades.map((trade, i) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  allTags={confluenceTags}
                  onUpdate={t => updateTrade(i, t)}
                  onRemove={() => removeTrade(i)}
                  onAddTag={onAddConfluenceTag}
                />
              ))}
            </div>
          </section>

          {/* ─── POST MARKET REVIEW ─────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8b5cf6' }}>Post Market Review</span>
              <div style={{ flex: 1, height: 1, background: '#1e2535' }} />
            </div>

            <div className="rounded-2xl border border-[#1e2535] bg-[#0d1117] p-5 flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>How are you feeling?</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {EMOTIONS.map(em => (
                    <button
                      key={em.value}
                      onClick={() => patch('emotion', form.emotion === em.value ? undefined : em.value)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '10px 14px', borderRadius: 12, border: '1px solid',
                        cursor: 'pointer', fontSize: 11, fontWeight: 500, transition: 'all 0.15s',
                        borderColor: form.emotion === em.value ? '#7c3aed' : '#252d3d',
                        background: form.emotion === em.value ? 'rgba(124,58,237,0.2)' : '#111520',
                        color: form.emotion === em.value ? '#c4b5fd' : '#6b7280',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{em.emoji}</span>
                      {em.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Post Market Notes</label>
                <textarea
                  value={form.postMarketNotes}
                  onChange={e => patch('postMarketNotes', e.target.value)}
                  rows={5}
                  placeholder="What went well? What to improve? Key lessons from today…"
                  style={{ width: '100%', background: '#161b27', border: '1px solid #2d3748', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#e2e8f0', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={e => (e.target.style.borderColor = '#2d3748')}
                />
              </div>
            </div>
          </section>

          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  )
}
