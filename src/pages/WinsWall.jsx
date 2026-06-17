import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'
import Companion from '../components/Companion'
import { getPercentage, getGrade, getTrafficLight, sortByAssessment } from '../utils/gradeLogic'

export default function WinsWall() {
  const { student } = useApp()
  const [scores, setScores] = useState([])
  const [config, setConfig] = useState(null)

  useEffect(() => {
    if (!student) return
    Promise.all([api.getScores({ studentId: student.id }), api.getConfig()])
      .then(([s, c]) => { setScores(s); setConfig(c) })
  }, [student?.id])

  if (!student || !config) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>

  const subjects = Object.keys(student.targets || {})

  const wins = []

  subjects.forEach(sub => {
    const subScores = scores.filter(s => s.subject === sub && !s.absent)
    const sorted = sortByAssessment(subScores, config.assessments)
    if (sorted.length < 2) return

    const latest = sorted[sorted.length - 1]
    const prev = sorted[sorted.length - 2]
    const latestPct = getPercentage(latest.marks, latest.max)
    const prevPct = getPercentage(prev.marks, prev.max)

    if (latestPct > prevPct) {
      const latestGrade = getGrade(latestPct, config.gradeBands)
      const prevGrade = getGrade(prevPct, config.gradeBands)
      wins.push({
        subject: sub,
        assessment: latest.assessment,
        gain: Math.round(latestPct - prevPct),
        latestGrade,
        prevGrade,
        isGradeUp: latestGrade !== prevGrade,
        hitTarget: latestGrade === student.targets[sub] || getGradeIndex(latestGrade, config.gradeBands) <= getGradeIndex(student.targets[sub], config.gradeBands)
      })
    }

    const trafficLight = getTrafficLight(getGrade(latestPct, config.gradeBands), student.targets[sub], config.gradeBands, config.failGrades)
    if (trafficLight === 'well_done') {
      if (!wins.find(w => w.subject === sub)) {
        wins.push({ subject: sub, assessment: latest.assessment, hitTarget: true, latestGrade: getGrade(latestPct, config.gradeBands), gain: 0 })
      }
    }
  })

  function getGradeIndex(grade, bands) {
    return bands.findIndex(b => b.grade === grade)
  }

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 px-4 pt-6">
      <h2 className="text-xl font-bold text-white mb-2">🏆 战绩墙</h2>
      <p className="text-white/40 text-sm mb-6">你的进步与胜利</p>

      {wins.length === 0 ? (
        <div className="flex flex-col items-center mt-16 gap-6">
          <Companion stage={student.companionStage} state="idle" size="md" />
          <p className="text-white/40 text-center">还没有战绩，去提交评估成绩吧！</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <Companion stage={student.companionStage} state="celebrate" size="md" />
          </div>
          <div className="flex flex-col gap-3">
            {wins.sort((a, b) => (b.hitTarget ? 1 : 0) - (a.hitTarget ? 1 : 0)).map((win, i) => (
              <div key={i} className="card-dark p-4 flex items-center gap-4 animate-slide-up" style={{ animationDelay: i * 0.1 + 's' }}>
                <div className="text-4xl">
                  {win.hitTarget ? '🎯' : win.isGradeUp ? '⬆️' : '📈'}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{win.subject}</div>
                  <div className="text-sm text-white/50">{win.assessment}</div>
                  {win.gain > 0 && <div className="text-xs text-green-400 mt-0.5">+{win.gain}% 进步！</div>}
                  {win.isGradeUp && <div className="text-xs text-yellow-400">{win.prevGrade} → {win.latestGrade} 等级提升！</div>}
                  {win.hitTarget && <div className="text-xs text-violet-400">目标达成 🎉</div>}
                </div>
                <div className="text-2xl font-bold" style={{ color: win.hitTarget ? '#fbbf24' : '#4ade80' }}>
                  {win.latestGrade}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
