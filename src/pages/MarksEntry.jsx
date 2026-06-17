import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'
import { getGrade, getPercentage } from '../utils/gradeLogic'

export default function MarksEntry() {
  const { subject } = useParams()
  const decodedSubject = decodeURIComponent(subject)
  const navigate = useNavigate()
  const { student } = useApp()

  const [config, setConfig] = useState(null)
  const [marks, setMarks] = useState('')
  const [max, setMax] = useState('100')
  const [assessment, setAssessment] = useState('')
  const [target, setTarget] = useState('')
  const [absent, setAbsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getConfig().then(c => {
      setConfig(c)
      if (c.assessments?.length) setAssessment(c.assessments[0])
    })
    if (student?.targets?.[decodedSubject]) setTarget(student.targets[decodedSubject])
  }, [student, decodedSubject])

  if (!student || !config) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>

  const pct = marks && max ? getPercentage(Number(marks), Number(max)) : null
  const previewGrade = pct !== null && !absent ? getGrade(pct, config.gradeBands) : null

  const handleSubmit = async () => {
    if (!absent && (!marks || !max)) { setError('请填写分数和满分'); return }
    if (!assessment) { setError('请选择评估'); return }
    if (Number(marks) > Number(max)) { setError('分数不能超过满分'); return }
    setError('')
    setSubmitting(true)
    try {
      // Update target if changed
      if (target && target !== student.targets?.[decodedSubject]) {
        await api.updateStudent(student.id, {
          targets: { ...student.targets, [decodedSubject]: target }
        })
      }
      const result = await api.submitScore({
        studentId: student.id,
        subject: decodedSubject,
        assessment,
        marks: absent ? 0 : Number(marks),
        max: Number(max),
        absent
      })
      navigate('/reward', { state: result })
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-space min-h-screen flex flex-col px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-white/40 text-2xl">←</button>
        <h2 className="text-xl font-bold text-white">输入成绩 · {decodedSubject}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Assessment selector */}
        <div className="card-dark p-4">
          <label className="block text-sm text-white/60 mb-2">评估</label>
          <div className="flex flex-wrap gap-2">
            {config.assessments.map(a => (
              <button
                key={a}
                onClick={() => setAssessment(a)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${assessment === a ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/60'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Absent toggle */}
        <div className="card-dark p-4 flex items-center justify-between">
          <span className="text-white/80">缺席（不参与计算）</span>
          <button
            onClick={() => setAbsent(!absent)}
            className={`w-12 h-6 rounded-full transition-all relative ${absent ? 'bg-orange-500' : 'bg-white/20'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${absent ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Marks input */}
        {!absent && (
          <div className="card-dark p-4">
            <label className="block text-sm text-white/60 mb-3">分数</label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={marks}
                onChange={e => setMarks(e.target.value)}
                placeholder="分数"
                className="flex-1 px-4 py-3 rounded-xl text-white text-center text-2xl font-bold outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                min="0"
                max={max}
              />
              <span className="text-white/40 text-xl">/</span>
              <input
                type="number"
                value={max}
                onChange={e => setMax(e.target.value)}
                placeholder="满分"
                className="w-24 px-4 py-3 rounded-xl text-white text-center text-2xl font-bold outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                min="1"
              />
            </div>
            {previewGrade && (
              <div className="mt-3 text-center">
                <span className="text-white/40 text-sm">预测等级：</span>
                <span className="text-2xl font-bold text-violet-300 ml-2">{previewGrade}</span>
                <span className="text-white/40 text-sm ml-2">({Math.round(pct)}%)</span>
              </div>
            )}
          </div>
        )}

        {/* Target grade */}
        <div className="card-dark p-4">
          <label className="block text-sm text-white/60 mb-2">下次目标等级</label>
          <div className="flex flex-wrap gap-2">
            {config.gradeBands.map(b => (
              <button
                key={b.grade}
                onClick={() => setTarget(b.grade)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${target === b.grade ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/60'}`}
              >
                {b.grade}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
        >
          {submitting ? '提交中…' : '✅ 提交成绩'}
        </button>
      </div>
    </div>
  )
}
