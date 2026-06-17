import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { getGrade, getPercentage, getGradeIndex, sortByAssessment } from '../utils/gradeLogic'

const SUBJECT_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#fb923c', '#e879f9', '#22d3ee']

export default function Progress() {
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

  // Line chart: each subject's % over assessments
  const lineData = config.assessments.map(assessment => {
    const entry = { name: assessment.replace('每月测验 ', '测') }
    subjects.forEach(sub => {
      const score = scores.find(s => s.subject === sub && s.assessment === assessment && !s.absent)
      if (score) entry[sub] = Math.round(getPercentage(score.marks, score.max))
    })
    return entry
  }).filter(e => Object.keys(e).length > 1)

  // Radar: current grade index (inverted so better = further out)
  const maxBandIdx = config.gradeBands.length - 1
  const radarData = subjects.map(sub => {
    const subScores = scores.filter(s => s.subject === sub && !s.absent)
    const sorted = sortByAssessment(subScores, config.assessments)
    const latest = sorted[sorted.length - 1]
    const pct = latest ? getPercentage(latest.marks, latest.max) : null
    const grade = pct !== null ? getGrade(pct, config.gradeBands) : null
    const gradeIdx = grade ? getGradeIndex(grade, config.gradeBands) : maxBandIdx
    const targetIdx = student.targets[sub] ? getGradeIndex(student.targets[sub], config.gradeBands) : maxBandIdx

    return {
      subject: sub,
      当前: Math.round((1 - gradeIdx / maxBandIdx) * 100),
      目标: Math.round((1 - targetIdx / maxBandIdx) * 100)
    }
  })

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 px-4 pt-6">
      <h2 className="text-xl font-bold text-white mb-6">📊 成长图表</h2>

      {/* Line chart */}
      <div className="card-dark p-4 mb-4">
        <h3 className="text-sm text-white/60 mb-3">各科成绩趋势</h3>
        {lineData.length === 0 ? (
          <p className="text-white/30 text-center text-sm py-4">暂无历史数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a0a2e', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              {subjects.map((sub, i) => (
                <Line key={sub} type="monotone" dataKey={sub} stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Radar chart */}
      <div className="card-dark p-4">
        <h3 className="text-sm text-white/60 mb-3">当前状态 vs 目标雷达图</h3>
        {radarData.length === 0 ? (
          <p className="text-white/30 text-center text-sm py-4">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
              <Radar name="当前" dataKey="当前" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} />
              <Radar name="目标" dataKey="目标" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a0a2e', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
