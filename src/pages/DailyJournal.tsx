import { useState, useRef, useEffect } from 'react'
import { CalendarDays, FileText, Plus } from 'lucide-react'
import type { DiaryEntries, DiaryTemplate } from '../types'

interface DailyJournalProps {
  diaryEntries: DiaryEntries
  onSave: (date: string, text: string) => void
  initialDate?: string
  templates: DiaryTemplate[]
  onSaveTemplate: (name: string, content: string) => void
  onDeleteTemplate: (id: string) => void
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateFull(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function DailyJournal({ diaryEntries, onSave, initialDate, templates, onSaveTemplate, onDeleteTemplate }: DailyJournalProps) {
  const today = todayStr()
  const [selectedDate, setSelectedDate] = useState(initialDate ?? today)
  const [draft, setDraft] = useState(diaryEntries[initialDate ?? today] || '')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const textRef = useRef<HTMLTextAreaElement>(null)
  const templateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate)
  }, [initialDate])

  useEffect(() => {
    setDraft(diaryEntries[selectedDate] || '')
    setTimeout(() => textRef.current?.focus(), 50)
  }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (v: string) => {
    setDraft(v)
    onSave(selectedDate, v)
  }

  const selectDate = (d: string) => setSelectedDate(d)

  const addTodayEntry = () => {
    selectDate(today)
    if (!diaryEntries[today]) onSave(today, '')
  }

  const handleSaveTemplate = () => {
    if (templateName.trim() && draft.trim()) {
      onSaveTemplate(templateName.trim(), draft)
      setTemplateName('')
      setSavingTemplate(false)
    }
  }

  const applyTemplate = (content: string) => {
    handleChange(content)
    setTimeout(() => textRef.current?.focus(), 50)
  }

  const sortedDates = Object.keys(diaryEntries)
    .filter(d => diaryEntries[d]?.trim())
    .sort((a, b) => b.localeCompare(a))

  const listDates = sortedDates.includes(today) ? sortedDates
    : selectedDate === today ? [today, ...sortedDates] : sortedDates

  const words = wordCount(draft)
  const chars = draft.length

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Left panel ── */}
      <div style={{
        width: 256, flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)',
        boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FileText size={16} color="var(--text-muted)" />
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-label)', letterSpacing: '-0.01em' }}>Daily Journal</span>
          </div>
          <button
            onClick={addTodayEntry}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)',
              background: selectedDate === today ? 'var(--bg-hover)' : 'var(--bg-surface)',
              color: selectedDate === today ? 'var(--text)' : 'var(--text-sub)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => {
              e.currentTarget.style.background = selectedDate === today ? 'var(--bg-hover)' : 'var(--bg-surface)'
              e.currentTarget.style.color = selectedDate === today ? 'var(--text)' : 'var(--text-sub)'
            }}
          >
            <CalendarDays size={13} />
            Today
          </button>
        </div>

        {/* Jump to Date */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Jump to Date</div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => selectDate(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7,
              padding: '6px 10px', fontSize: 14, color: 'var(--text-sub)', outline: 'none',
              fontFamily: 'inherit', cursor: 'pointer',
            }}
          />
        </div>

        {/* Templates section */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: savingTemplate || templates.length > 0 ? 6 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Templates
            </span>
            {!savingTemplate && (
              <button
                onClick={() => { setSavingTemplate(true); setTimeout(() => templateInputRef.current?.focus(), 50) }}
                style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                + Save
              </button>
            )}
          </div>

          {savingTemplate && (
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              <input
                ref={templateInputRef}
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Template name…"
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); if (e.key === 'Escape') { setSavingTemplate(false); setTemplateName('') } }}
                style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-mid)', borderRadius: 6, padding: '5px 8px', fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || !draft.trim()}
                style={{ background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: templateName.trim() && draft.trim() ? 1 : 0.4 }}
              >✓</button>
              <button
                onClick={() => { setSavingTemplate(false); setTemplateName('') }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 7px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}
              >✕</button>
            </div>
          )}

          {templates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {templates.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <button
                    onClick={() => applyTemplate(t.content)}
                    title={`Apply template: ${t.name}`}
                    style={{
                      flex: 1, textAlign: 'left', padding: '5px 7px', borderRadius: 6,
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: 'var(--text-sub)', fontFamily: 'inherit',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    📄 {t.name}
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(t.id)}
                    title="Delete template"
                    style={{ padding: '3px 5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 13, transition: 'color 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {templates.length === 0 && !savingTemplate && (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Write something, then click <em>+ Save</em> to make a reusable template.
            </div>
          )}
        </div>

        {/* Entries list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {listDates.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <Plus size={24} color="var(--border-mid)" style={{ marginBottom: 8 }} />
              <p style={{ color: 'var(--text-dim)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
                No entries yet.<br />Start writing today.
              </p>
            </div>
          ) : (
            listDates.map(date => {
              const isSelected = date === selectedDate
              const preview = (diaryEntries[date] || '').trim().slice(0, 60)
              const isToday = date === today
              return (
                <button
                  key={date}
                  onClick={() => selectDate(date)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 9,
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--border-mid)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.12s', marginBottom: 2,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? 'var(--text)' : 'var(--text-sub)' }}>
                      {formatDateShort(date)}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Today
                      </span>
                    )}
                  </div>
                  {preview && (
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                      {preview}{(diaryEntries[date] || '').length > 60 ? '…' : ''}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right panel: editor ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: '20px 32px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 2 }}>
            {formatDateFull(selectedDate)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {selectedDate === today ? 'Today' : selectedDate}
          </div>
        </div>

        {/* Textarea area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
          <textarea
            ref={textRef}
            value={draft}
            onChange={e => handleChange(e.target.value)}
            placeholder={`Write your thoughts for ${selectedDate === today ? 'today' : formatDateShort(selectedDate)}…\n\nReflect on the market, your mindset, what went well, what to improve, personal notes — this is your private daily journal.`}
            style={{
              width: '100%',
              minHeight: 'calc(100vh - 280px)',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 18,
              color: 'var(--text)',
              lineHeight: 1.85,
              fontFamily: 'inherit',
              caretColor: '#22c55e',
            }}
          />
        </div>

        {/* Footer status bar */}
        <div style={{
          flexShrink: 0, padding: '10px 32px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-panel)',
        }}>
          <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            {words} word{words !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 14, color: 'var(--border-mid)' }}>·</span>
          <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            {chars} character{chars !== 1 ? 's' : ''}
          </span>
          {draft.trim() && (
            <>
              <span style={{ fontSize: 14, color: 'var(--border-mid)' }}>·</span>
              <span style={{ fontSize: 14, color: '#22c55e55' }}>Auto-saved</span>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
