import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { api } from '../../api/client'
import TeacherNav from '../../components/TeacherNav'
import { getGrade, getPercentage, getTrafficLight, getCurrentScore } from '../../utils/gradeLogic'

const CELL_BG = {
  well_done: 'bg-traffic-green traffic-green',
  almost: 'bg-traffic-yellow traffic-yellow',
  priority: 'bg-traffic-red traffic-red',
  none: 'text-white/20'
}

export default function CommandCentre() {
  const { isTeacher } = useApp()
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isTeacher) { navigate('/teacher'); return }
    Promise.all([api.getStudents(), api.getScores({}), api.getConfig()])
      .then(([st, sc, c]) => { setStudents(st); setScores(sc); setConfig(c) })
      .finally(() => setLoading(false))
  }, [isTeacher])

  if (loading) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>
  if (!config) return null

  // Collect all subjects
  const allSubjects = [...new Set(students.flatMap(s => Object.keys(s.targets || {})))]

  // Build grid data
  const rows = students.map(student => {
    const subjectData = allSubjects.map(sub => {
      const score = getCurrentScore(scores, student.id, sub)
      const pct = score ? getPercentage(score.marks, score.max) : null
      const currentGrade = pct !== null ? getGrade(pct, config.gradeBands) : null
      const trafficLight = currentGrade
        ? getTrafficLight(currentGrade, student.targets?.[sub], config.gradeBands, config.failGrades)
        : 'none'
      return { currentGrade, trafficLight }
    })

    const redCount = subjectData.filter(s => s.trafficLight === 'priority').length

    return { student, subjectData, redCount }
  }).sort((a, b) => b.redCount - a.redCount)

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 pt-6">
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold text-white">⚔️ 指挥中心</h2>
        <p className="text-white/40 text-sm">全班成绩一览 · 红色优先关注</p>
      </div>

      <div className="px-2 overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 400 }}>
          <thead>
            <tr>
              <th className="sticky left-0 text-left px-2 py-2 text-white/50 font-normal" style={{ background: '#0f0a1e', zIndex: 10, minWidth: 80 }}>姓名</th>
              {allSubjects.map(sub => (
                <th key={sub} className="px-1 py-2 text-white/50 font-normal text-center" style={{ minWidth: 40 }}>
                  {sub.slice(0, 2)}
                </th>
              ))}
              <th className="px-2 py-2 text-white/50 font-normal text-center">🔴</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, subjectData, redCount }) => (
              <tr key={student.id}>
                <td className="sticky left-0 px-2 py-1.5 font-bold text-white text-xs" style={{ background: '#0f0a1e', zIndex: 5 }}>
                  {student.name}
                </td>
                {subjectData.map((data, i) => (
                  <td key={i} className="px-1 py-1.5">
                    <div className={`rounded text-center py-0.5 px-1 font-bold ${CELL_BG[data.trafficLight] || 'text-white/20'}`}>
                      {data.currentGrade || '—'}
                    </div>
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center">
                  {redCount > 0 ? <span className="traffic-red font-bold">{redCount}</span> : <span className="text-white/20">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 mt-4 flex gap-4 text-xs text-white/50">
        <span><span className="traffic-green">■</span> 达标</span>
        <span><span className="traffic-yellow">■</span> 差一步</span>
        <span><span className="traffic-red">■</span> 需关注</span>
      </div>

      <TeacherNav />
    </div>
  )
}
