import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../api/client'
import TeacherNav from '../../components/TeacherNav'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getGrade, getPercentage, getTrafficLight, getCurrentScore } from '../../utils/gradeLogic'

export default function ClassAnalytics() {
  const { isTeacher } = useApp()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState([])
  const [config, setConfig] = useState(null)

  useEffect(() => {
    if (!isTeacher) { navigate('/teacher'); return }
    Promise.all([api.getStudents(), api.getScores({}), api.getConfig()])
      .then(([st, sc, c]) => { setStudents(st); setScores(sc); setConfig(c) })
  }, [isTeacher])

  if (!config) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>

  const allSubjects = [...new Set(students.flatMap(s => Object.keys(s.targets || {})))]

  const subjectStats = allSubjects.map(sub => {
    let total = 0, count = 0, redCount = 0
    students.forEach(student => {
      const score = getCurrentScore(scores, student.id, sub)
      if (!score) return
      const pct = getPercentage(score.marks, score.max)
      total += pct
      count++
      const grade = getGrade(pct, config.gradeBands)
      const tl = getTrafficLight(grade, student.targets?.[sub], config.gradeBands, config.failGrades)
      if (tl === 'priority') redCount++
    })
    const avg = count ? Math.round(total / count) : null
    return { subject: sub, avg, count, redCount, redPct: count ? Math.round(redCount / count * 100) : 0 }
  }).filter(s => s.count > 0)

  const sorted = [...subjectStats].sort((a, b) => b.redPct - a.redPct)

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 pt-6 px-4">
      <h2 className="text-xl font-bold text-white mb-1">📊 班级分析</h2>
      <p className="text-white/40 text-sm mb-6">各科弱项分布（需关注比例）</p>

      {sorted.length === 0 ? (
        <p className="text-white/30 text-center mt-10">暂无数据</p>
      ) : (
        <>
          <div className="card-dark p-4 mb-4">
            <h3 className="text-sm text-white/60 mb-3">需关注学生比例（%）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sorted} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <YAxis type="category" dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} width={50} />
                <Tooltip
                  contentStyle={{ background: '#1a0a2e', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8 }}
                  formatter={(v) => [`${v}%`, '需关注']}
                />
                <Bar dataKey="redPct" radius={[0, 4, 4, 0]}>
                  {sorted.map((entry, i) => (
                    <Cell key={i} fill={entry.redPct >= 50 ? '#f87171' : entry.redPct >= 25 ? '#fbbf24' : '#4ade80'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card-dark p-4">
            <h3 className="text-sm text-white/60 mb-3">科目平均分</h3>
            <div className="flex flex-col gap-2">
              {subjectStats.sort((a, b) => (a.avg || 0) - (b.avg || 0)).map(s => (
                <div key={s.subject} className="flex items-center gap-3">
                  <span className="text-white/70 text-sm w-16 text-right">{s.subject}</span>
                  <div className="flex-1 h-5 rounded bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${s.avg}%`,
                        background: s.avg >= 70 ? '#4ade80' : s.avg >= 50 ? '#fbbf24' : '#f87171'
                      }}
                    />
                  </div>
                  <span className="text-white/50 text-sm w-12 text-right">{s.avg}%</span>
                </div>
              ))}
            </div>
          </div>

          {sorted[0] && sorted[0].redPct >= 30 && (
            <div className="mt-4 card-dark p-4 bg-traffic-red">
              <p className="text-red-300 text-sm">
                ⚠️ <strong>{sorted[0].subject}</strong> 有 {sorted[0].redPct}% 的学生需要重点关注，建议优先补课。
              </p>
            </div>
          )}
        </>
      )}

      <TeacherNav />
    </div>
  )
}
