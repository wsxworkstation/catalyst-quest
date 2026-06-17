import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../api/client'
import TeacherNav from '../../components/TeacherNav'

const DEFAULT_SUBJECTS = ['数学', '英语', '华文', '马来文', '物理', '化学', '生物', '历史']
const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D', 'E', 'G']

function StudentForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [form, setForm] = useState(initial?.form || 4)
  const [cls, setCls] = useState(initial?.class || '')
  const [targets, setTargets] = useState(initial?.targets || {})

  const handleTargetChange = (sub, grade) => {
    setTargets(t => ({ ...t, [sub]: grade }))
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), form: Number(form), class: cls, targets })
  }

  return (
    <div className="card-dark p-4 flex flex-col gap-3 mb-4">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="学生姓名"
        className="w-full px-3 py-2 rounded-lg text-white placeholder-white/30 outline-none"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
      <div className="flex gap-3">
        <select value={form} onChange={e => setForm(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
          {[1,2,3,4,5].map(f => <option key={f} value={f} style={{ background: '#1a0a2e' }}>Form {f}</option>)}
        </select>
        <input value={cls} onChange={e => setCls(e.target.value)} placeholder="班级 (如 4 Amanah)"
          className="flex-1 px-3 py-2 rounded-lg text-white placeholder-white/30 outline-none"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
      </div>
      <div>
        <p className="text-xs text-white/40 mb-2">目标等级（各科）</p>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_SUBJECTS.map(sub => (
            <div key={sub} className="flex items-center gap-2">
              <span className="text-xs text-white/60 w-14 text-right">{sub}</span>
              <select value={targets[sub] || ''} onChange={e => handleTargetChange(sub, e.target.value)}
                className="flex-1 px-2 py-1 rounded text-white text-xs outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <option value="" style={{ background: '#1a0a2e' }}>—</option>
                {GRADES.map(g => <option key={g} value={g} style={{ background: '#1a0a2e' }}>{g}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="flex-1 py-2 rounded-lg font-bold text-white" style={{ background: '#7c3aed' }}>保存</button>
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-white/50 bg-white/10">取消</button>
      </div>
    </div>
  )
}

export default function Roster() {
  const { isTeacher } = useApp()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  const load = () => api.getStudents().then(setStudents)

  useEffect(() => {
    if (!isTeacher) { navigate('/teacher'); return }
    load()
  }, [isTeacher])

  const handleSave = async (data) => {
    if (editing) {
      await api.updateStudent(editing.id, data)
    } else {
      await api.createStudent(data)
    }
    setEditing(null)
    setAdding(false)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('确认删除？此操作不可恢复。')) return
    await api.deleteStudent(id)
    load()
  }

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 pt-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">📋 学生名单</h2>
          <p className="text-white/40 text-sm">{students.length} 位学生</p>
        </div>
        <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-xl font-bold text-white text-sm" style={{ background: '#7c3aed' }}>
          + 新增
        </button>
      </div>

      {adding && <StudentForm onSave={handleSave} onCancel={() => setAdding(false)} />}

      <div className="flex flex-col gap-3">
        {students.map(s => (
          <div key={s.id}>
            {editing?.id === s.id ? (
              <StudentForm initial={s} onSave={handleSave} onCancel={() => setEditing(null)} />
            ) : (
              <div className="card-dark p-4 flex items-center gap-3">
                <div className="text-3xl">
                  {s.companionStage === 'sun' ? '☀️' : s.companionStage === 'comet' ? '☄️' : s.companionStage === 'star' ? '⭐' : '✨'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{s.name}</div>
                  <div className="text-xs text-white/40">Form {s.form} · {s.class} · Lv.{s.level}</div>
                  <div className="text-xs text-white/30 mt-0.5">{Object.keys(s.targets || {}).length} 科设定目标</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(s)} className="px-3 py-1 rounded-lg bg-white/10 text-white/60 text-xs">编辑</button>
                  <button onClick={() => handleDelete(s.id)} className="px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-xs">删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <TeacherNav />
    </div>
  )
}
