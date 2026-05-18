import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/map', label: '地图', icon: '🗺️' },
  { path: '/planner', label: '行程', icon: '📋' },
  { path: '/profile', label: '我的', icon: '👶' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="safe-area-bottom glass flex items-center justify-around py-1.5 px-2 border-t border-white/50">
      {tabs.map((tab) => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`relative flex flex-col items-center gap-0.5 min-w-[56px] py-1.5 px-2 rounded-xl transition-all duration-200 ${
              active
                ? 'text-warm-orange scale-105'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <span className={`text-xl transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className={`text-[10px] font-semibold transition-all ${active ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-warm-orange animate-fade-in" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
