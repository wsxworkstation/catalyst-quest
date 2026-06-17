import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'
import Companion from '../components/Companion'
import HPBar from '../components/HPBar'
import { getGrade, getPercentage, getTrafficLight, getHPPercent, sortByAssessment } from '../utils/gradeLogic'
import { getTrend } from '../utils/trendLogic'
import MonsterCard from '../components/MonsterCard'

export default function Battle() {
  const { subject } = useParams()
  const decodedSubject = decodeURIComponent(subject)
  const navigate = useNavigate()
  const { student } = useApp()
  const [scores, setScores] = useState([])
  const [strategies, setStrategies] = useState([])
  const [config, setConfig] = useState(null)

  useEffect(() => {
    if (!student) return
    Promise.all([
      api.getScores({ studentId: student.id, subject: decodedSubject }),
      api.getStrategies(),
      api.getConfig()
    ]).then(([s, st, c]) => {
      setScores(s)
      setStrategies(st)
      setConfig(c)
    })
  }, [student?.id, decodedSubject])

  if (!student) return null
  if (!config) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>

  const nonAbsent = scores.filter(s => !s.absent)
  const sorted = sortByAssessment(nonAbsent, config.assessments)
  const latest = sorted[sorted.length - 1]
  const pct = latest ? getPercentage(latest.marks, latest.max) : null
  const currentGrade = pct !== null ? getGrade(pct, config.gradeBands) : null
  const targetGrade = student.targets?.[decodedSubject]
  const trafficLight = currentGrade
    ? getTrafficLight(currentGrade, targetGrade, config.gradeBands, config.failGrades)
    : 'almost'
  const hpPercent = currentGrade ? getHPPercent(currentGrade, targetGrade, config.gradeBands) : 50
  const trend = getTrend(scores, student.id, decodedSubject, config.assessments)

  const strategy = strategies.find(s => s.subject === decodedSubject)

  const monster = MonsterCard.MONSTERS[decodedSubject] || { emoji: '👾', name: '未知怪' }

  const chartData = sorted.map(s => ({
    name: s.assessment.replace('每月测验 ', '测 ').replace('三月考', '三月').replace('年中考', '年中').replace('预考', '预考').replace('预测', '预测'),
    分数: Math.round(getPercentage(s.marks, s.max))
  }))

  const companionState = trafficLight === 'well_done' ? 'celebrate' : trend === 'improving' ? 'cheer' : trafficLight === 'priority' ? 'encourage' : 'idle'

  const statusLine = {
    well_done: '🟢 已攻克目标！',
    almost: '🟡 距目标只差一步！',
    priority: '🔴 需要重点突破！'
  }[trafficLight]

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24">
      <div className="px-4 pt-6 flex items-center gap-3">
        <button onClick={() => navigate('/map')} className="text-white/40 text-2xl">←</button>
        <h2 className="text-xl font-bold text-white flex-1">{decodedSubject} · {monster.name}</h2>
        <span className="text-3xl">{monster.emoji}</span>
      </div>

      {/* Monster HP */}
      <div className="px-4 py-4 card-dark mx-4 mt-4">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-5xl ${trafficLight !== 'well_done' ? 'animate-float' : 'opacity-40 grayscale'}`}>{monster.emoji}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">怪兽HP</span>
              <span className={trafficLight === 'well_done' ? 'traffic-green' : trafficLight === 'almost' ? 'traffic-yellow' : 'traffic-red'}>{statusLine}</span>
            </div>
            <HPBar percent={hpPercent} trafficLight={trafficLight} showLabel={false} />
            <div className="flex justify-between text-xs mt-1 text-white/40">
              <span>目标：{targetGrade || '未设定'}</span>
              <span>当前：{currentGrade || '暂无成绩'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="mx-4 mt-4 card-dark p-4">
          <h3 className="text-sm text-white/60 mb-3">📈 历次成绩走势</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1a0a2e', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8 }}
                labelStyle={{ color: '#a78bfa' }}
                itemStyle={{ color: '#e2d9f3' }}
              />
              {targetGrade && config.gradeBands.find(b => b.grade === targetGrade) && (
                <ReferenceLine
                  y={config.gradeBands.find(b => b.grade === targetGrade).min}
                  stroke="#fbbf24"
                  strokeDasharray="4 4"
                  label={{ value: `目标${targetGrade}`, fill: '#fbbf24', fontSize: 10 }}
                />
              )}
              <Line type="monotone" dataKey="分数" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-white/30 text-center mt-1">趋势：{
            { improving: '⬆️ 持续进步', declining: '⬇️ 需要加强', flat: '➡️ 稳定发挥', volatile: '🔀 波动较大', new: '🆕 首次参与' }[trend]
          }</div>
        </div>
      )}

      {/* Strategy quest */}
      <div className="mx-4 mt-4 card-dark p-4">
        <h3 className="text-sm text-white/60 mb-2">📜 光光的任务提示</h3>
        <div className="flex gap-3">
          <Companion stage={student.companionStage} state={companionState} size="sm" showLine={false} />
          <div className="flex-1">
            {strategy ? (
              <p className="text-sm text-white/80 leading-relaxed">{strategy.text}</p>
            ) : (
              <p className="text-sm text-white/30 italic">老师还没填写这科的策略，敬请期待…</p>
            )}
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="mx-4 mt-6">
        <button
          onClick={() => navigate(`/marks/${encodeURIComponent(decodedSubject)}`)}
          className="w-full py-4 rounded-2xl text-lg font-bold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
        >
          ⚔️ 记录这次评估
        </button>
      </div>
    </div>
  )
}
