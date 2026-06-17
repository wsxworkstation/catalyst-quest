import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../api/client'
import TeacherNav from '../../components/TeacherNav'

const DEFAULT_SUBJECTS = ['数学', '英语', '华文', '马来文', '物理', '化学', '生物', '历史', '地理', '经济']

function StrategyEditor({ initial, onSave, onCancel }) {
  const [subject, setSubject] = useState(initial?.subject || '')
  const [topicHint, setTopicHint] = useState(initial?.topicHint || '')
  const [text, setText] = useState(initial?.text || '')
  const [source, setSource] = useState(initial?.source || 'Mr. Jackson')

  return (
    <div className="card-dark p-4 mb-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <select value={subject} onChange={e => setSubject(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg text-white text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <option value="" style={{ background: '#1a0a2e' }}>选择科目</option>
          {DEFAULT_SUBJECTS.map(s => <option key={s} value={s} style={{ background: '#1a0a2e' }}>{s}</option>)}
        </select>
        <input value={topicHint} onChange={e => setTopicHint(e.target.value)} placeholder="课题提示（可选）"
          className="flex-1 px-3 py-2 rounded-lg text-white text-sm placeholder-white/30 outline-none"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
        placeholder="输入策略内容……"
        className="w-full px-3 py-2 rounded-lg text-white text-sm placeholder-white/30 outline-none resize-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
      <input value={source} onChange={e => setSource(e.target.value)} placeholder="来源 (老师名字)"
        className="w-full px-3 py-2 rounded-lg text-white text-sm placeholder-white/30 outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
      <div className="flex gap-2">
        <button onClick={() => subject && text && onSave({ subject, topicHint, text, source })}
          disabled={!subject || !text}
          className="flex-1 py-2 rounded-lg font-bold text-white text-sm disabled:opacity-50"
          style={{ background: '#7c3aed' }}>保存</button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-white/50 bg-white/10 text-sm">取消</button>
      </div>
    </div>
  )
}

export default function StrategyLibrary() {
  const { isTeacher } = useApp()
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('')

  const load = () => api.getStrategies().then(setStrategies)

  useEffect(() => {
    if (!isTeacher) { navigate('/teacher'); return }
    load()
  }, [isTeacher])

  const handleSave = async (data) => {
    if (editing) {
      await api.updateStrategy(editing.id, data)
    } else {
      await api.createStrategy(data)
    }
    setEditing(null)
    setAdding(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('确认删除此策略？')) return
    await api.deleteStrategy(id)
    load()
  }

  const filtered = strategies.filter(s => !filter || s.subject === filter)
  const coverageSubjects = DEFAULT_SUBJECTS.filter(s => !strategies.find(st => st.subject === s))

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 pt-6 px-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-white">📜 策略库</h2>
          <p className="text-white/40 text-sm">{strategies.length} 条策略</p>
        </div>
        <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-xl font-bold text-sm text-white" style={{ background: '#7c3aed' }}>
          + 新增
        </button>
      </div>

      {coverageSubjects.length > 0 && (
        <div className="mb-4 card-dark p-3 bg-traffic-yellow">
          <p className="text-yellow-300 text-xs">⚠️ 以下科目暂无策略：{coverageSubjects.join('、')}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter('')} className={`px-3 py-1 rounded-full text-xs ${!filter ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50'}`}>全部</button>
        {DEFAULT_SUBJECTS.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-xs ${filter === s ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50'}`}>{s}</button>
        ))}
      </div>

      {adding && <StrategyEditor onSave={handleSave} onCancel={() => setAdding(false)} />}

      <div className="flex flex-col gap-3">
        {filtered.map(s => (
          <div key={s.id}>
            {editing?.id === s.id ? (
              <StrategyEditor initial={s} onSave={handleSave} onCancel={() => setEditing(null)} />
            ) : (
              <div className="card-dark p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-violet-300 font-bold text-sm">{s.subject}</span>
                    {s.topicHint && <span className="ml-2 text-xs text-white/40">· {s.topicHint}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(s)} className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50">编辑</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs px-2 py-0.5 rounded bg-red-900/20 text-red-400">删除</button>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{s.text}</p>
                <p className="text-xs text-white/30 mt-2">— {s.source}</p>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-white/30 text-center text-sm mt-6">暂无策略</p>}
      </div>

      <TeacherNav />
    </div>
  )
}
