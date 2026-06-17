import { useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'
import Companion from '../components/Companion'
import { getXPProgress, getLevelBand, COMPANION_STAGES } from '../utils/xpSystem'

const RARITY_CLASS = { '普通': 'rarity-bg-common rarity-common', '稀有': 'rarity-bg-rare rarity-rare', '史诗': 'rarity-bg-epic rarity-epic', '传说': 'rarity-bg-legendary rarity-legendary', '神话': 'rarity-bg-mythic rarity-mythic' }

const BADGES = [
  { id: 'first_score', emoji: '🎯', name: '初登场', desc: '首次提交成绩' },
  { id: 'improve_1', emoji: '⬆️', name: '突破者', desc: '某科成绩进步' },
  { id: 'hit_target', emoji: '🏹', name: '神射手', desc: '达成目标等级' },
  { id: 'no_absent', emoji: '📚', name: '全勤英雄', desc: '零缺席记录' }
]

export default function Profile() {
  const { student, refreshStudent } = useApp()
  const [items, setItems] = useState([])
  const [scores, setScores] = useState([])

  useEffect(() => {
    if (!student) return
    Promise.all([api.getItems(), api.getScores({ studentId: student.id }), api.getStudents()])
      .then(([allItems, sc, allStudents]) => {
        setItems(allItems)
        setScores(sc)
        const fresh = allStudents.find(s => s.id === student.id)
        if (fresh) refreshStudent(fresh)
      })
  }, [student?.id])

  if (!student) return <div className="bg-space min-h-screen flex items-center justify-center text-white/40">加载中…</div>

  const { level, xpInCurrentLevel, xpNeeded, percent: xpPercent } = getXPProgress(student.xp)
  const band = getLevelBand(level)
  const stageInfo = COMPANION_STAGES[student.companionStage] || COMPANION_STAGES.spark

  const inventory = (student.inventory || [])
    .map(id => items.find(it => it.id === id))
    .filter(Boolean)

  const earnedBadges = []
  if (scores.length > 0) earnedBadges.push('first_score')
  const hasImprove = scores.some((s, _, arr) => {
    const prev = arr.filter(x => x.subject === s.subject && x.studentId === s.studentId && !x.absent)
    return prev.length >= 2
  })
  if (hasImprove) earnedBadges.push('improve_1')
  if (scores.every(s => !s.absent)) earnedBadges.push('no_absent')

  return (
    <div className="bg-space min-h-screen flex flex-col pb-24 px-4 pt-6">
      <h2 className="text-xl font-bold text-white mb-6">🎖️ 英雄档案</h2>

      {/* Hero card */}
      <div className="card-dark p-6 mb-4 flex items-center gap-5">
        <Companion stage={student.companionStage} state="idle" size="md" showLine={false} />
        <div className="flex-1">
          <div className="text-xl font-bold text-white">{student.name}</div>
          <div className="text-sm text-white/50 mb-2">{student.class} · {band}</div>
          <div className="text-xs text-white/60 mb-1">Lv.{level} — {stageInfo.name}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: xpPercent + '%' }} />
            </div>
            <span className="text-xs text-white/40">{xpInCurrentLevel}/{xpNeeded}</span>
          </div>
        </div>
      </div>

      {/* Pity counter */}
      <div className="card-dark p-4 mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">盲盒保底进度</div>
          <div className="text-2xl font-bold text-violet-300">{student.boxPity || 0} / 10</div>
        </div>
        <div className="text-4xl">🎁</div>
      </div>

      {/* Badges */}
      <div className="card-dark p-4 mb-4">
        <h3 className="text-sm text-white/60 mb-3">勋章</h3>
        <div className="flex flex-wrap gap-3">
          {BADGES.map(b => {
            const earned = earnedBadges.includes(b.id)
            return (
              <div key={b.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${earned ? 'bg-white/10' : 'opacity-30'}`}>
                <span className="text-2xl">{b.emoji}</span>
                <span className="text-xs text-center text-white/80">{b.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Inventory */}
      <div className="card-dark p-4">
        <h3 className="text-sm text-white/60 mb-3">物品收藏（{inventory.length}件）</h3>
        {inventory.length === 0 ? (
          <p className="text-white/30 text-sm">还没有物品，去完成评估赢取盲盒吧！</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {inventory.map((item, i) => (
              <div key={i} className={`rounded-xl p-2 flex flex-col items-center gap-1 w-16 text-center ${RARITY_CLASS[item.rarity] || ''}`}>
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs leading-tight">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
