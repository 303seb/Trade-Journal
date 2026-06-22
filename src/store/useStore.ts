import { useState, useCallback } from 'react'
import type { JournalEntry, MonthlyGoal, TradingRule, TradingAccount } from '../types'

const KEYS = {
  journal: 'tj_journal',
  goals: 'tj_goals',
  confluences: 'tj_confluences',
  rules: 'tj_rules',
  accounts: 'tj_accounts',
}

const DEFAULT_CONFLUENCES = [
  'Order Block', 'Fair Value Gap', 'Breaker Block', 'MSS', 'ChoCh',
  'Liquidity Sweep', 'Displacement', 'OTE', 'Power of 3',
  'NWOG', 'NDOG', 'Mitigation Block', 'Rejection Block',
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
  const [tradingRules, setTradingRules] = useState<TradingRule[]>(() =>
    load(KEYS.rules, [])
  )
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>(() =>
    load(KEYS.accounts, [])
  )

  const deleteJournalEntry = useCallback((date: string) => {
    setJournalEntries(prev => {
      const next = prev.filter(e => e.date !== date)
      save(KEYS.journal, next)
      return next
    })
  }, [])

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

  const setMonthlyGoal = useCallback((month: string, amount: number) => {
    setMonthlyGoals(prev => {
      const next = prev.some(g => g.month === month)
        ? prev.map(g => (g.month === month ? { ...g, amount } : g))
        : [...prev, { month, amount }]
      save(KEYS.goals, next)
      return next
    })
  }, [])

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

  const addTradingRule = useCallback((text: string) => {
    setTradingRules(prev => {
      const next = [...prev, { id: genId(), text }]
      save(KEYS.rules, next)
      return next
    })
  }, [])

  const removeTradingRule = useCallback((id: string) => {
    setTradingRules(prev => {
      const next = prev.filter(r => r.id !== id)
      save(KEYS.rules, next)
      return next
    })
  }, [])

  const updateTradingRule = useCallback((id: string, text: string) => {
    setTradingRules(prev => {
      const next = prev.map(r => r.id === id ? { ...r, text } : r)
      save(KEYS.rules, next)
      return next
    })
  }, [])

  const addTradingAccount = useCallback((account: TradingAccount) => {
    setTradingAccounts(prev => {
      const next = [...prev, account]
      save(KEYS.accounts, next)
      return next
    })
  }, [])

  const updateTradingAccount = useCallback((account: TradingAccount) => {
    setTradingAccounts(prev => {
      const next = prev.map(a => a.id === account.id ? account : a)
      save(KEYS.accounts, next)
      return next
    })
  }, [])

  const deleteTradingAccount = useCallback((id: string) => {
    setTradingAccounts(prev => {
      const next = prev.filter(a => a.id !== id)
      save(KEYS.accounts, next)
      return next
    })
  }, [])

  return {
    journalEntries,
    monthlyGoals,
    confluenceTags,
    tradingRules,
    upsertJournalEntry,
    deleteJournalEntry,
    setMonthlyGoal,
    addConfluenceTag,
    deleteConfluenceTag,
    addTradingRule,
    removeTradingRule,
    updateTradingRule,
    tradingAccounts,
    addTradingAccount,
    updateTradingAccount,
    deleteTradingAccount,
  }
}
