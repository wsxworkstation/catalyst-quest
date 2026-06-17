import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useApp } from '../contexts/AppContext'

export default function SignIn() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { loginStudent } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    api.getStudents().then(setStudents).finally(() => setLoading(false))
  }, [])

  const filtered = students.filter(s => s.name.includes(search))

  const handleSelect = (student) => {
    loginStudent(student)
    navigate('/form')
  }

  return (
    <div className="bg-space min-h-screen flex flex-col px-4 pt-10 pb-20">
      <button onClick={() => navigate('/')} className="text-white/40 text-sm mb-6 self-start">← 返回</button>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🧑‍🎓</div>
        <h2 className="text-2xl font-bold text-white">选择你的英雄</h2>
        <p className="text-white/40 text-sm mt-1">找到你的名字，开始冒险！</p>
      </div>

      <input
        type="text"
        placeholder="搜索名字…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
      />

      {loading ? (
        <div className="text-center text-white/40 mt-10">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-white/40 mt-10">找不到学生</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className="card-dark p-4 text-left flex items-center gap-4 active:scale-95 transition-all"
            >
              <div className="text-3xl">
                {s.companionStage === 'sun' ? '☀️' : s.companionStage === 'comet' ? '☄️' : s.companionStage === 'star' ? '⭐' : '✨'}
              </div>
              <div>
                <div className="font-bold text-white">{s.name}</div>
                <div className="text-xs text-white/40">Lv.{s.level} · {s.class}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
