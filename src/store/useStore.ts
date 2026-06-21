import { useState, useCallback } from 'react'
import type { Trade, JournalEntry, MonthlyGoal } from '../types'

const KEYS = {
  trades: 'tj_trades',
  journal: 'tj_journal',
  goals: 'tj_goals',
  confluences: 'tj_confluences',
}

const DEFAULT_CONFLUENCES = [
  'VWAP', 'Supply Zone', 'Demand Zone', 'Trend', 'Key Level',
  'Breakout', 'Opening Range', 'Gap Fill', 'Volume', 'News',
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useStore() {
  const [trades, setTrades] = useState<Trade[]>(() => load(KEYS.trades, []))
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    load(KEYS.journal, [])
  )
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(() => load(KEYS.goals, []))
  const [confluenceTags, setConfluenceTags] = useState<string[]>(() => {
    const stored = localStorage.getItem(KEYS.confluences)
    if (stored === null) {
      save(KEYS.confluences, DEFAULT_CONFLUENCES)
      return DEFAULT_CONFLUENCES
    }
    return JSON.parse(stored) as string[]
  })

  // ── Dashboard trades ──────────────────────────────────────────────────────
  const addTrade = useCallback((trade: Omit<Trade, 'id' | 'createdAt'>) => {
    const next: Trade = { ...trade, id: genId(), createdAt: new Date().toISOString() }
    setTrades(prev => { const n = [...prev, next]; save(KEYS.trades, n); return n })
  }, [])

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => { const n = prev.filter(t => t.id !== id); save(KEYS.trades, n); return n })
  }, [])

  // ── Journal entries ───────────────────────────────────────────────────────
  const upsertJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntries(prev => {
      const exists = prev.some(e => e.date === entry.date)
      const next = exists
        ? prev.map(e => (e.date === entry.date ? { ...entry, updatedAt: new Date().toISOString() } : e))
        : [...prev, { ...entry, updatedAt: new Date().toISOString() }]
      save(KEYS.journal, next)
      return next
    })
  }, [])

  // ── Monthly goals ─────────────────────────────────────────────────────────
  const setMonthlyGoal = useCallback((month: string, amount: number) => {
    setMonthlyGoals(prev => {
      const next = prev.some(g => g.month === month)
        ? prev.map(g => (g.month === month ? { ...g, amount } : g))
        : [...prev, { month, amount }]
      save(KEYS.goals, next)
      return next
    })
  }, [])

  // ── Confluence tags ───────────────────────────────────────────────────────
  const addConfluenceTag = useCallback((tag: string) => {
    setConfluenceTags(prev => {
      if (prev.includes(tag)) return prev
      const next = [...prev, tag]
      save(KEYS.confluences, next)
      return next
    })
  }, [])

  const deleteConfluenceTag = useCallback((tag: string) => {
    setConfluenceTags(prev => {
      const next = prev.filter(t => t !== tag)
      save(KEYS.confluences, next)
      return next
    })
  }, [])

  return {
    trades,
    journalEntries,
    monthlyGoals,
    confluenceTags,
    addTrade,
    deleteTrade,
    upsertJournalEntry,
    setMonthlyGoal,
    addConfluenceTag,
    deleteConfluenceTag,
  }
}
