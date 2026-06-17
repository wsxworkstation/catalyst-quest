import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../api/client'
import TeacherNav from '../../components/TeacherNav'

export default function Setup() {
  const { isTeacher } = useApp()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newAssessment, setNewAssessment] = useState('')

  useEffect(() => {
    if (!isTeacher) { navigate('/teacher'); return }
    api.getConfig().then(setConfig)
  }, [isTeacher])

  if (!config) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>

  const updateAssessments = (list) => setConfig(c => ({ ...c, assessments: list }))
  const updateGradeBands = (bands) => setConfig(c => ({ ...c, gradeBands: bands }))
  const updateFailGrades = (grades) => setConfig(c => ({ ...c, failGrades: grades }))
  const updateXP = (key, val) => setConfig(c => ({ ...c, xpConfig: { ...c.xpConfig, [key]: Number(val) } }))
  const updateBoxProb = (bandIdx, rarity, val) => {
    const bands = config.blindBoxProbabilities.map((b, i) => i === bandIdx ? { ...b, [rarity]: Number(val) } : b)
    setConfig(c => ({ ...c, blindBoxProbabilities: bands }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateConfig(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const addAssessment = () => {
    if (!newAssessment.trim()) return
    updateAssessments([...config.assessments, newAssessment.trim()])
    setNewAssessment('')
  }

  const RARITIES = ['普通', '稀有', '史诗', '传说', '神话']

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 pt-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">⚙️ 评估 / 等级设定</h2>
          <p className="text-white/40 text-sm">全局配置</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-xl font-bold text-sm text-white disabled:opacity-50"
          style={{ background: saved ? '#059669' : '#7c3aed' }}>
          {saved ? '✓ 已保存' : saving ? '保存中…' : '保存'}
        </button>
      </div>

      {/* Assessments */}
      <div className="card-dark p-4 mb-4">
        <h3 className="text-sm text-white/60 mb-3">评估列表（顺序即权重）</h3>
        <div className="flex flex-col gap-2 mb-3">
          {config.assessments.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-white/70 flex-1 text-sm">{a}</span>
              <button onClick={() => updateAssessments(config.assessments.filter((_, idx) => idx !== i))}
                className="text-red-400 text-xs px-2 py-0.5 rounded bg-red-900/20">删除</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newAssessment} onChange={e => setNewAssessment(e.target.value)}
            placeholder="新评估名称"
            className="flex-1 px-3 py-1.5 rounded-lg text-white text-sm placeholder-white/30 outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
          <button onClick={addAssessment} className="px-3 py-1.5 rounded-lg bg-violet-700 text-white text-sm">添加</button>
        </div>
      </div>

      {/* Grade bands */}
      <div className="card-dark p-4 mb-4">
        <h3 className="text-sm text-white/60 mb-3">等级标准（最低分）</h3>
        <div className="grid grid-cols-2 gap-2">
          {config.gradeBands.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-yellow-300 font-bold w-8 text-sm">{b.grade}</span>
              <input type="number" value={b.min} min="0" max="100"
                onChange={e => updateGradeBands(config.gradeBands.map((gb, idx) => idx === i ? { ...gb, min: Number(e.target.value) } : gb))}
                className="flex-1 px-2 py-1 rounded text-white text-sm text-center outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <span className="text-white/30 text-xs">%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fail grades */}
      <div className="card-dark p-4 mb-4">
        <h3 className="text-sm text-white/60 mb-3">失败等级（自动标红）</h3>
        <div className="flex flex-wrap gap-2">
          {config.gradeBands.map(b => {
            const isFail = config.failGrades.includes(b.grade)
            return (
              <button key={b.grade}
                onClick={() => updateFailGrades(isFail ? config.failGrades.filter(g => g !== b.grade) : [...config.failGrades, b.grade])}
                className={`px-3 py-1 rounded-lg font-bold text-sm ${isFail ? 'bg-red-600 text-white' : 'bg-white/10 text-white/50'}`}>
                {b.grade}
              </button>
            )
          })}
        </div>
      </div>

      {/* XP config */}
      <div className="card-dark p-4 mb-4">
        <h3 className="text-sm text-white/60 mb-3">XP 奖励设定</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(config.xpConfig || {}).map(([key, val]) => {
            const labels = { completeAssessment: '完成评估', improvedResult: '成绩进步', hitTarget: '达成目标', noAbsenceStreak: '连续出席' }
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-white/60 text-sm flex-1">{labels[key] || key}</span>
                <input type="number" value={val} min="0"
                  onChange={e => updateXP(key, e.target.value)}
                  className="w-20 px-2 py-1 rounded text-white text-sm text-center outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <span className="text-white/30 text-xs">XP</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Blind box probabilities */}
      <div className="card-dark p-4 mb-4">
        <h3 className="text-sm text-white/60 mb-3">盲盒概率设定（%）</h3>
        {config.blindBoxProbabilities.map((band, i) => (
          <div key={i} className="mb-4">
            <p className="text-white/70 text-xs font-bold mb-2">{band.band} (Lv{band.minLevel}–{band.maxLevel})</p>
            <div className="grid grid-cols-5 gap-1">
              {RARITIES.map(r => (
                <div key={r} className="flex flex-col items-center gap-1">
                  <span className={`text-xs ${r === '普通' ? 'rarity-common' : r === '稀有' ? 'rarity-rare' : r === '史诗' ? 'rarity-epic' : r === '传说' ? 'rarity-legendary' : 'rarity-mythic'}`}>{r}</span>
                  <input type="number" value={band[r]} min="0" max="100" step="0.1"
                    onChange={e => updateBoxProb(i, r, e.target.value)}
                    className="w-full px-1 py-1 rounded text-white text-xs text-center outline-none"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <TeacherNav />
    </div>
  )
}
