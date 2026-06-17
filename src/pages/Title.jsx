import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useEffect } from 'react'

export default function Title() {
  const navigate = useNavigate()
  const { isTeacher } = useApp()

  useEffect(() => {
    if (isTeacher) navigate('/teacher/command')
  }, [isTeacher, navigate])

  return (
    <div className="bg-space min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.6 + 0.2,
              animation: `pulse-glow ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-8xl animate-float">✨</div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 0 30px rgba(167,139,250,0.8)' }}>
            学习大冒险
          </h1>
          <p className="text-violet-300 text-lg">Catalyst Quest</p>
          <p className="text-white/40 text-sm mt-2">与光光一起，征服每一只怪兽！</p>
        </div>

        <button
          onClick={() => navigate('/signin')}
          className="w-full max-w-xs py-4 rounded-2xl text-xl font-bold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}
        >
          开始冒险 ⚔️
        </button>

        <button
          onClick={() => navigate('/teacher')}
          className="text-white/30 text-xs underline"
        >
          老师入口
        </button>
      </div>
    </div>
  )
}
