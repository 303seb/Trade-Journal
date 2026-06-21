import { LayoutDashboard, BookOpen, TrendingUp } from 'lucide-react'

type Page = 'dashboard' | 'journal'

interface NavbarProps {
  page: Page
  onNavigate: (page: Page) => void
}

export function Navbar({ page, onNavigate }: NavbarProps) {
  return (
    <nav className="h-16 bg-[#0d1117] border-b border-[#1e2535] flex items-center px-6 justify-between shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">TradeJournal</span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            page === 'dashboard'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#161b27]'
          }`}
        >
          <LayoutDashboard size={15} />
          Dashboard
        </button>
        <button
          onClick={() => onNavigate('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            page === 'journal'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#161b27]'
          }`}
        >
          <BookOpen size={15} />
          Journal
        </button>
      </div>

      {/* Spacer to center nav */}
      <div className="w-32" />
    </nav>
  )
}
