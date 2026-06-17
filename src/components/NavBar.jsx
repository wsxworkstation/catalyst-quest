import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { student, logoutStudent } = useApp()

  if (!student) return null
  if (location.pathname.startsWith('/teacher')) return null

  const tabs = [
    { path: '/map', icon: '🗺️', label: '地图' },
    { path: '/progress', icon: '📊', label: '成长' },
    { path: '/profile', icon: '🎖️', label: '档案' },
    { path: '/wins', icon: '🏆', label: '战绩' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(15,10,30,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
      <div className="flex justify-around py-2 max-w-md mx-auto">
        {tabs.map(tab => {
          const active = location.pathname.startsWith(tab.path)
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-all ${active ? 'text-violet-400' : 'text-white/40'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          )
        })}
        <button
          onClick={() => { logoutStudent(); navigate('/') }}
          className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-white/40"
        >
          <span className="text-xl">🚪</span>
          <span className="text-xs">退出</span>
        </button>
      </div>
    </nav>
  )
}
