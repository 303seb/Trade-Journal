export type TradeResult = 'Win' | 'Loss' | 'BE' | 'Faded'
export type AccountType = 'Live' | 'Funded' | 'Eval'
export type SessionType = 'NY' | 'Asia' | 'London'

export type Emotion =
  | 'very_happy'
  | 'happy'
  | 'neutral'
  | 'frustrated'
  | 'angry'
  | 'very_angry'

export interface TradeLog {
  id: string
  result: TradeResult
  accounts: AccountType[]
  symbol: string
  side: 'Long' | 'Short'
  contracts: string
  entryPrice: string
  exitPrice: string
  targetPrice: string      // actual target price level
  takeProfit: string       // TP in points
  stopLoss: string         // SL in points
  pnl: string              // gross P&L, auto-calculated from symbol/entry/exit/contracts
  fees: string             // trading fees in dollars
  drawdown: string         // points of drawdown — shown for Win / BE / Faded
  duration: string         // trade duration e.g. "45m", "2h"
  tradeNumber: string      // trade # for the day
  confluences: string[]
  sessions: string[]       // session tags (flexible strings)
  dol: string[]            // draw on liquidity tags
  htfImgKey?: string       // high timeframe screenshot (base64)
  execImgKey?: string      // execution screenshot (base64)
  setup?: string           // setup description e.g. "5m FVG entry"
  grade?: string           // trade grade: A+, A, B, C, D, F
  time?: string            // trade time HH:MM
  notes?: string           // post-trade reflections
}

export interface TradingRule {
  id: string
  text: string
}

export interface JournalEntry {
  id: string
  date: string             // YYYY-MM-DD
  premktImgKey?: string
  premktAnalysis: string
  redFolderNews: boolean
  redFolderNewsText: string
  trades: TradeLog[]
  emotion?: Emotion
  postMarketNotes: string
  rulesFollowed: string[]  // IDs of TradingRules followed this day
  updatedAt: string
}

export interface MonthlyGoal {
  amount: number
  month: string            // YYYY-MM
}

export interface DashTrade {
  id: string
  date: string
  pnl: number
  result: TradeResult
  symbol: string
  side: 'Long' | 'Short'
}
