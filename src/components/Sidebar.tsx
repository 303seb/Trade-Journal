import { LayoutDashboard, BookOpen, TrendingUp, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'

export type Page = 'dashboard' | 'journal' | 'strategies'

interface SidebarProps {
  page: Page
  onNavigate: (page: Page) => void
  collapsed: boolean
  onToggle: () => void
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { page: 'journal', label: 'Journal', icon: <BookOpen size={18} /> },
  { page: 'strategies', label: 'Strategies', icon: <BarChart2 size={18} /> },
]

export function Sidebar({ page, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className="h-screen flex flex-col bg-[#0d1117] border-r border-[#1e2535] shrink-0 transition-all duration-200"
      style={{ width: collapsed ? 60 : 200 }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-3 h-16 border-b border-[#1e2535] ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <TrendingUp size={15} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
            TradeJournal
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 p-2 pt-3">
        {NAV_ITEMS.map(item => {
          const active = page === item.page
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all
                ${active
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#161b27] border border-transparent'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[#1e2535]">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-slate-500 hover:text-slate-300 hover:bg-[#161b27] transition-colors text-xs"
        >
          {collapsed ? <ChevronRight size={15} /> : (
            <>
              <ChevronLeft size={15} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
