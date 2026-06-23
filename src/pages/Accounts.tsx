import { useState } from 'react'
import { Plus, X, Edit2, Trash2, TrendingUp, Shield, Award, ArrowRight } from 'lucide-react'
import type { TradingAccount, LiveAccount, EvalAccount, FundedAccount, JournalEntry } from '../types'
import { formatCurrency } from '../utils/stats'

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const EVAL_SIZES = [25000, 50000, 100000, 150000]
const PROP_FIRMS = ['FTMO', 'MyForexFunds', 'The Funded Trader', 'Apex Trader', 'TopStep', 'E8 Funding', 'True Forex Funds', 'Other']

const TYPE_META = {
  Live:    { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',    border: 'rgba(74,222,128,0.25)',  icon: TrendingUp, label: 'Live Account'    },
  Eval:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',    border: 'rgba(251,191,36,0.25)',  icon: Shield,     label: 'Evaluation'      },
  Funded:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',    border: 'rgba(96,165,250,0.25)',  icon: Award,      label: 'Funded Account'  },
}

const inp: React.CSSProperties = {
  background: 'var(--bg-input)', border: '1px solid var(--border-mid)', borderRadius: 8,
  padding: '10px 13px', fontSize: 15, color: 'var(--text)', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

function fLabel(text: string) {
  return <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{text}</div>
}

// ── Account P&L from journal trades ──────────────────────────────────────────

function getAccountPnl(account: TradingAccount, entries: JournalEntry[]): number {
  const journalPnl = entries.flatMap(e => e.trades).filter(t =>
    (t.accounts || []).includes(account.name)
  ).reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

  if (account.type === 'Eval' && account.startingBalance != null) {
    return journalPnl + (account.startingBalance - account.size)
  }
  return journalPnl
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────

type AccountType = 'Live' | 'Eval' | 'Funded'

interface ModalState {
  accountType: AccountType
  name: string
  broker: string
  balance: string
  propFirm: string
  size: number
  maxDrawdown: string
  profitTarget: string
  startingBalance: string
}

function emptyModal(type: AccountType = 'Live'): ModalState {
  return { accountType: type, name: '', broker: '', balance: '', propFirm: '', size: 50000, maxDrawdown: '', profitTarget: '', startingBalance: '' }
}

function AccountModal({ initial, onSave, onClose }: {
  initial?: TradingAccount
  onSave: (a: TradingAccount) => void
  onClose: () => void
}) {
  const [state, setState] = useState<ModalState>(() => {
    if (!initial) return emptyModal()
    if (initial.type === 'Live') return { accountType: 'Live', name: initial.name, broker: initial.broker, balance: String(initial.balance), propFirm: '', size: 50000, maxDrawdown: '', profitTarget: '', startingBalance: '' }
    if (initial.type === 'Eval') return { accountType: 'Eval', name: initial.name, broker: '', balance: '', propFirm: initial.propFirm, size: initial.size, maxDrawdown: String(initial.maxDrawdown), profitTarget: String(initial.profitTarget), startingBalance: initial.startingBalance != null ? String(initial.startingBalance) : '' }
    return { accountType: 'Funded', name: initial.name, broker: '', balance: '', propFirm: initial.propFirm, size: initial.size, maxDrawdown: '', profitTarget: '', startingBalance: '' }
  })

  const s = (k: keyof ModalState, v: unknown) => setState(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!state.name.trim()) return
    const base = { id: initial?.id ?? genId(), name: state.name.trim(), createdAt: initial?.createdAt ?? new Date().toISOString() }
    let account: TradingAccount
    if (state.accountType === 'Live') {
      account = { ...base, type: 'Live', broker: state.broker, balance: parseFloat(state.balance) || 0 } as LiveAccount
    } else if (state.accountType === 'Eval') {
      const evalAcc: EvalAccount = { ...base, type: 'Eval', propFirm: state.propFirm, size: state.size, maxDrawdown: parseFloat(state.maxDrawdown) || 0, profitTarget: parseFloat(state.profitTarget) || 0 }
      if (state.startingBalance.trim()) evalAcc.startingBalance = parseFloat(state.startingBalance) || 0
      account = evalAcc
    } else {
      account = { ...base, type: 'Funded', propFirm: state.propFirm, size: state.size } as FundedAccount
    }
    onSave(account)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{initial ? 'Edit Account' : 'Add Account'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          ><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

          {/* Account type selector */}
          <div>
            {fLabel('Account Type')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {(['Live', 'Eval', 'Funded'] as AccountType[]).map(t => {
                const active = state.accountType === t
                const meta = TYPE_META[t]
                const Icon = meta.icon
                return (
                  <button key={t} onClick={() => s('accountType', t)} style={{
                    padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${active ? meta.border : 'var(--border)'}`,
                    background: active ? meta.bg : 'transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={17} color={active ? meta.color : 'var(--text-muted)'} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: active ? meta.color : 'var(--text-muted)' }}>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            {fLabel('Account Name')}
            <input value={state.name} onChange={e => s('name', e.target.value)} placeholder={
              state.accountType === 'Live' ? 'e.g. Main Live' : state.accountType === 'Eval' ? 'e.g. FTMO Eval #1' : 'e.g. Apex Funded'
            } style={inp}
              onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')} />
          </div>

          {/* Live fields */}
          {state.accountType === 'Live' && (
            <>
              <div>
                {fLabel('Broker')}
                <input value={state.broker} onChange={e => s('broker', e.target.value)} placeholder="e.g. TD Ameritrade, Tradovate, NinjaTrader" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')} />
              </div>
              <div>
                {fLabel('Account Balance ($)')}
                <input type="number" value={state.balance} onChange={e => s('balance', e.target.value)} placeholder="50000" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')} />
              </div>
            </>
          )}

          {/* Eval fields */}
          {state.accountType === 'Eval' && (
            <>
              <div>
                {fLabel('Prop Firm')}
                <select value={state.propFirm} onChange={e => s('propFirm', e.target.value)} style={{ ...inp, cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')}>
                  <option value="">Select firm…</option>
                  {PROP_FIRMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                {fLabel('Account Size')}
                <div style={{ display: 'flex', gap: 8 }}>
                  {EVAL_SIZES.map(sz => {
                    const active = state.size === sz
                    return (
                      <button key={sz} onClick={() => s('size', sz)} style={{
                        flex: 1, padding: '9px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                        border: `1px solid ${active ? 'rgba(251,191,36,0.4)' : 'var(--border)'}`,
                        background: active ? 'rgba(251,191,36,0.1)' : 'transparent',
                        color: active ? '#fbbf24' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                      }}>${(sz / 1000).toFixed(0)}k</button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  {fLabel('Max Drawdown ($)')}
                  <input type="number" value={state.maxDrawdown} onChange={e => s('maxDrawdown', e.target.value)} placeholder="2500" style={inp}
                    onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')} />
                </div>
                <div>
                  {fLabel('Profit Target ($)')}
                  <input type="number" value={state.profitTarget} onChange={e => s('profitTarget', e.target.value)} placeholder="3000" style={inp}
                    onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')} />
                </div>
              </div>
              <div>
                {fLabel('Current Balance Override (optional)')}
                <input
                  type="number"
                  value={state.startingBalance}
                  onChange={e => s('startingBalance', e.target.value)}
                  placeholder={`Default: ${formatCurrency(state.size)} — set if account already has a balance`}
                  style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
                  Set this if you joined the app mid-eval. Adjusts P&L and progress to reflect your actual balance.
                </div>
              </div>
            </>
          )}

          {/* Funded fields */}
          {state.accountType === 'Funded' && (
            <>
              <div>
                {fLabel('Prop Firm')}
                <select value={state.propFirm} onChange={e => s('propFirm', e.target.value)} style={{ ...inp, cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')}>
                  <option value="">Select firm…</option>
                  {PROP_FIRMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                {fLabel('Account Size ($)')}
                <input type="number" value={state.size || ''} onChange={e => s('size', parseFloat(e.target.value) || 0)} placeholder="150000" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')} onBlur={e => (e.target.style.borderColor = 'var(--border-mid)')} />
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-mid)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-mid)' }}
          >Cancel</button>
          <button onClick={handleSave} disabled={!state.name.trim()} style={{
            padding: '9px 22px', borderRadius: 8, border: 'none',
            background: state.name.trim() ? 'var(--btn-bg)' : 'var(--bg-hover)',
            color: state.name.trim() ? 'var(--btn-text)' : 'var(--text-muted)',
            fontSize: 14, fontWeight: 600, cursor: state.name.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (state.name.trim()) e.currentTarget.style.background = 'var(--btn-hover)' }}
            onMouseLeave={e => { if (state.name.trim()) e.currentTarget.style.background = 'var(--btn-bg)' }}
          >Save Account</button>
        </div>

      </div>
    </div>
  )
}

// ── Account Card ──────────────────────────────────────────────────────────────

function AccountCard({ account, entries, onEdit, onDelete, onConvertToFunded }: {
  account: TradingAccount
  entries: JournalEntry[]
  onEdit: () => void
  onDelete: () => void
  onConvertToFunded?: (a: EvalAccount) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [confirmConvert, setConfirmConvert] = useState(false)
  const meta = TYPE_META[account.type]
  const Icon = meta.icon
  const pnl = getAccountPnl(account, entries)
  const pnlColor = pnl > 0 ? '#4ade80' : pnl < 0 ? '#f87171' : 'var(--text-muted)'
  const tradeCount = entries.flatMap(e => e.trades).filter(t => (t.accounts || []).includes(account.name)).length

  const evalProgress = account.type === 'Eval' && account.profitTarget > 0
    ? Math.round((pnl / account.profitTarget) * 100)
    : 0
  const evalHitTarget = account.type === 'Eval' && account.profitTarget > 0 && pnl >= account.profitTarget

  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${meta.border}`, borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>

      {/* Top row: type badge + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} color={meta.color} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: meta.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{meta.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{account.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          ><Edit2 size={12} /></button>
          {confirmDel ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => onDelete()} style={{ padding: '4px 10px', borderRadius: 6, background: '#f87171', color: '#000', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
              <button onClick={() => setConfirmDel(false)} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            ><Trash2 size={12} /></button>
          )}
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {account.type === 'Live' && (
          <>
            {account.broker && <Detail label="Broker" value={account.broker} />}
            <Detail label="Starting Balance" value={formatCurrency(account.balance)} />
          </>
        )}
        {account.type === 'Eval' && (
          <>
            <Detail label="Prop Firm" value={account.propFirm || '—'} />
            <Detail label="Account Size" value={formatCurrency(account.size)} />
            {account.startingBalance != null && (
              <Detail label="Starting Balance" value={formatCurrency(account.startingBalance)} valueColor="var(--text-sub)" />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Detail label="Max Drawdown" value={`-${formatCurrency(account.maxDrawdown)}`} valueColor="#f87171" />
              <Detail label="Profit Target" value={`+${formatCurrency(account.profitTarget)}`} valueColor="#4ade80" />
            </div>
          </>
        )}
        {account.type === 'Funded' && (
          <>
            <Detail label="Prop Firm" value={account.propFirm || '—'} />
            <Detail label="Account Size" value={formatCurrency(account.size)} />
          </>
        )}
      </div>

      {/* P&L from trades */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            {account.type === 'Eval' && account.startingBalance != null ? 'Effective P&L' : 'P&L from Trades'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: pnlColor }}>{pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Trades</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-sub)' }}>{tradeCount}</div>
        </div>
      </div>

      {/* Progress bar for Eval */}
      {account.type === 'Eval' && account.profitTarget > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Progress to Target</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: evalHitTarget ? '#4ade80' : pnl >= 0 ? '#4ade80' : '#f87171' }}>
              {evalProgress}%
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0, Math.min(100, (pnl / account.profitTarget) * 100))}%`, height: '100%', background: evalHitTarget ? '#4ade80' : pnl >= 0 ? '#4ade80' : '#f87171', borderRadius: 999, transition: 'width 0.4s' }} />
          </div>
        </div>
      )}

      {/* Convert to Funded button */}
      {account.type === 'Eval' && evalHitTarget && (
        <div>
          {confirmConvert ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 10 }}>
              <span style={{ flex: 1, fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>Convert this eval to a funded account?</span>
              <button onClick={() => { onConvertToFunded?.(account as EvalAccount); setConfirmConvert(false) }} style={{ padding: '5px 12px', borderRadius: 7, background: '#60a5fa', color: '#000', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Convert
              </button>
              <button onClick={() => setConfirmConvert(false)} style={{ padding: '5px 10px', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmConvert(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)',
                color: '#60a5fa', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.18)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.1)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)' }}
            >
              <Award size={14} />
              🎉 Target Hit — Convert to Funded
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

    </div>
  )
}

function Detail({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: valueColor || 'var(--text-sub)' }}>{value}</span>
    </div>
  )
}

// ── Main Accounts Page ────────────────────────────────────────────────────────

interface AccountsProps {
  accounts: TradingAccount[]
  entries: JournalEntry[]
  onAdd: (a: TradingAccount) => void
  onUpdate: (a: TradingAccount) => void
  onDelete: (id: string) => void
}

export function Accounts({ accounts, entries, onAdd, onUpdate, onDelete }: AccountsProps) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TradingAccount | undefined>()

  const openAdd = () => { setEditing(undefined); setShowModal(true) }
  const openEdit = (a: TradingAccount) => { setEditing(a); setShowModal(true) }
  const handleSave = (a: TradingAccount) => {
    if (editing) onUpdate(a)
    else onAdd(a)
    setShowModal(false)
  }

  const handleConvertToFunded = (evalAcc: EvalAccount) => {
    const funded: FundedAccount = {
      id: evalAcc.id,
      type: 'Funded',
      name: evalAcc.name,
      propFirm: evalAcc.propFirm,
      size: evalAcc.size,
      createdAt: evalAcc.createdAt,
    }
    onUpdate(funded)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Accounts</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage your trading accounts and track their performance.</p>
          </div>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'var(--btn-bg)', color: 'var(--btn-text)', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--btn-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--btn-bg)')}
          ><Plus size={15} />Add Account</button>
        </div>

        {/* Account type legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {(['Live', 'Eval', 'Funded'] as const).map(t => {
            const meta = TYPE_META[t]
            const count = accounts.filter(a => a.type === t).length
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: count > 0 ? meta.bg : 'transparent', border: `1px solid ${count > 0 ? meta.border : 'var(--border)'}`, borderRadius: 8, transition: 'all 0.15s' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: count > 0 ? meta.color : 'var(--border-mid)' }} />
                <span style={{ fontSize: 13, color: count > 0 ? meta.color : 'var(--text-muted)', fontWeight: 600 }}>{meta.label}</span>
                <span style={{ fontSize: 13, color: count > 0 ? meta.color : 'var(--text-muted)', fontWeight: 700, opacity: 0.7 }}>{count}</span>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {accounts.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '80px 0', color: 'var(--text-dim)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={26} color="var(--border-mid)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>No accounts yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>Add a live, eval, or funded account to get started.</div>
            </div>
            <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-mid)', color: 'var(--text-sub)', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-sub)' }}
            ><Plus size={14} />Add First Account</button>
          </div>
        )}

        {/* Account grid */}
        {accounts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {accounts.map(a => (
              <AccountCard
                key={a.id}
                account={a}
                entries={entries}
                onEdit={() => openEdit(a)}
                onDelete={() => onDelete(a.id)}
                onConvertToFunded={handleConvertToFunded}
              />
            ))}
          </div>
        )}

      </div>

      {showModal && (
        <AccountModal
          initial={editing}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
