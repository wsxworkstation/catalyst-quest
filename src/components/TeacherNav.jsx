import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const TABS = [
  { path: '/teacher/command', icon: '⚔️', label: '指挥' },
  { path: '/teacher/analytics', icon: '📊', label: '分析' },
  { path: '/teacher/roster', icon: '📋', label: '名单' },
  { path: '/teacher/setup', icon: '⚙️', label: '设定' },
  { path: '/teacher/strategies', icon: '📜', label: '策略' },
  { path: '/teacher/activity', icon: '📡', label: '记录' }
]

export default function TeacherNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logoutTeacher } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: 'rgba(15,10,30,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
      <div className="flex justify-around py-2 max-w-lg mx-auto">
        {TABS.map(tab => {
          const active = location.pathname === tab.path
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${active ? 'text-violet-400' : 'text-white/40'}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          )
        })}
        <button onClick={() => { logoutTeacher(); navigate('/') }}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-white/40">
          <span className="text-xl">🚪</span>
          <span className="text-xs">退出</span>
        </button>
      </div>
    </nav>
  )
}
