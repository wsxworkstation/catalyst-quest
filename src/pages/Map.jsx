import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'
import MonsterCard from '../components/MonsterCard'
import Companion from '../components/Companion'
import { getGrade, getPercentage, getTrafficLight, getHPPercent, getCurrentScore } from '../utils/gradeLogic'
import { getXPProgress } from '../utils/xpSystem'

export default function Map() {
  const { student, refreshStudent } = useApp()
  const [scores, setScores] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student) return
    Promise.all([
      api.getScores({ studentId: student.id }),
      api.getConfig()
    ]).then(([s, c]) => {
      setScores(s)
      setConfig(c)
    }).finally(() => setLoading(false))

    // Refresh student data
    api.getStudents().then(all => {
      const fresh = all.find(s => s.id === student.id)
      if (fresh) refreshStudent(fresh)
    })
  }, [student?.id])

  if (!student) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">请先登录</div>
  if (loading) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>
  if (!config) return null

  const subjects = Object.keys(student.targets || {})
  const { level, xpInCurrentLevel, xpNeeded, percent: xpPercent } = getXPProgress(student.xp)

  const subjectData = subjects.map(subject => {
    const score = getCurrentScore(scores, student.id, subject)
    const pct = score ? getPercentage(score.marks, score.max) : null
    const currentGrade = pct !== null ? getGrade(pct, config.gradeBands) : null
    const targetGrade = student.targets[subject]
    const trafficLight = currentGrade
      ? getTrafficLight(currentGrade, targetGrade, config.gradeBands, config.failGrades)
      : 'almost'
    const hpPercent = currentGrade
      ? getHPPercent(currentGrade, targetGrade, config.gradeBands)
      : 50
    return { subject, currentGrade, targetGrade, trafficLight, hpPercent }
  })

  const redCount = subjectData.filter(s => s.trafficLight === 'priority').length
  const greenCount = subjectData.filter(s => s.trafficLight === 'well_done').length

  const companionState = redCount > 0 ? 'idle' : greenCount === subjects.length ? 'celebrate' : 'idle'

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">
            {student.companionStage === 'sun' ? '☀️' : student.companionStage === 'comet' ? '☄️' : student.companionStage === 'star' ? '⭐' : '✨'}
          </div>
          <div className="flex-1">
            <div className="font-bold text-white">{student.name}</div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span>Lv.{level}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: xpPercent + '%' }} />
              </div>
              <span>{xpInCurrentLevel}/{xpNeeded} XP</span>
            </div>
          </div>
          <div className="text-right text-xs text-white/40">
            <div>⚔️ {greenCount}/{subjects.length}</div>
            <div>已攻克</div>
          </div>
        </div>
      </div>

      {/* Companion */}
      <div className="py-4 flex justify-center">
        <Companion stage={student.companionStage} state={companionState} size="md" />
      </div>

      {/* Monsters */}
      <div className="px-4 flex flex-col gap-3">
        <h3 className="text-white/60 text-sm font-semibold tracking-wide uppercase">冒险地图</h3>
        {subjectData
          .sort((a, b) => {
            const order = { priority: 0, almost: 1, well_done: 2 }
            return order[a.trafficLight] - order[b.trafficLight]
          })
          .map(({ subject, currentGrade, targetGrade, trafficLight, hpPercent }) => (
            <MonsterCard
              key={subject}
              subject={subject}
              trafficLight={trafficLight}
              hpPercent={hpPercent}
              currentGrade={currentGrade}
              targetGrade={targetGrade}
            />
          ))}
      </div>
    </div>
  )
}
