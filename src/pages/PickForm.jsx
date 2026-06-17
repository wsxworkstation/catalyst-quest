import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'

const FORMS = [
  { form: 1, label: 'Form 1', subtitle: '冒险新手', emoji: '🌱' },
  { form: 2, label: 'Form 2', subtitle: '成长战士', emoji: '🌿' },
  { form: 3, label: 'Form 3', subtitle: '中级英雄', emoji: '🌟' },
  { form: 4, label: 'Form 4', subtitle: '精英勇者', emoji: '⚔️' },
  { form: 5, label: 'Form 5', subtitle: 'SPM 传说', emoji: '🔥' }
]

export default function PickForm() {
  const navigate = useNavigate()
  const { student, refreshStudent } = useApp()

  const handleSelect = async (form) => {
    if (student && student.form !== form) {
      try {
        const updated = await api.updateStudent(student.id, { form })
        refreshStudent({ ...student, ...updated, form })
      } catch {}
    }
    navigate('/map')
  }

  return (
    <div className="bg-space min-h-screen flex flex-col px-4 pt-10 pb-20">
      <button onClick={() => navigate('/signin')} className="text-white/40 text-sm mb-6 self-start">← 返回</button>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🌍</div>
        <h2 className="text-2xl font-bold text-white">选择你的世界</h2>
        {student && (
          <p className="text-violet-300 text-sm mt-1">欢迎回来，{student.name}！</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {FORMS.map(({ form, label, subtitle, emoji }) => {
          const isCurrentForm = student?.form === form
          return (
            <button
              key={form}
              onClick={() => handleSelect(form)}
              className={`card-dark p-5 text-left flex items-center gap-4 active:scale-95 transition-all ${isCurrentForm ? 'card-glow' : ''}`}
              style={isCurrentForm ? { borderColor: 'rgba(167,139,250,0.6)' } : {}}
            >
              <div className="text-4xl">{emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-white text-lg">{label}</div>
                <div className="text-sm text-white/40">{subtitle}</div>
              </div>
              {isCurrentForm && <span className="text-violet-400 text-sm font-bold">当前</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
