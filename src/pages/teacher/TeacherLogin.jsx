import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useApp } from '../../contexts/AppContext'

export default function TeacherLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginTeacher } = useApp()
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    setError('')
    try {
      await api.teacherLogin(password)
      loginTeacher()
      navigate('/teacher/command')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-space min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="text-white/40 text-sm mb-8 self-start">← 返回</button>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h2 className="text-2xl font-bold text-white">老师登入</h2>
          <p className="text-white/40 text-sm mt-1">指挥中心</p>
        </div>

        <div className="card-dark p-6 flex flex-col gap-4">
          <input
            type="password"
            placeholder="输入密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            {loading ? '登入中…' : '登入'}
          </button>
          <p className="text-white/20 text-xs text-center">默认密码：teacher123</p>
        </div>
      </div>
    </div>
  )
}
