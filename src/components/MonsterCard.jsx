import { useNavigate } from 'react-router-dom'
import HPBar from './HPBar'

const MONSTERS = {
  '数学':  { emoji: '🐉', name: '方程龙' },
  '英语':  { emoji: '🐛', name: '字母虫' },
  '华文':  { emoji: '🐼', name: '墨水兽' },
  '马来文':{ emoji: '🌿', name: '丛林精灵' },
  '物理':  { emoji: '⚡', name: '力场兽' },
  '化学':  { emoji: '🧪', name: '毒雾怪' },
  '生物':  { emoji: '🦠', name: '细胞王' },
  '历史':  { emoji: '⏰', name: '时间守卫' },
  '地理':  { emoji: '🗺️', name: '地图魔' },
  '经济':  { emoji: '💰', name: '金币龙' }
}

export default function MonsterCard({ subject, trafficLight, hpPercent, currentGrade, targetGrade }) {
  const navigate = useNavigate()
  const monster = MONSTERS[subject] || { emoji: '👾', name: '未知怪' }

  const borderClass = {
    well_done: 'bg-traffic-green',
    almost: 'bg-traffic-yellow',
    priority: 'bg-traffic-red'
  }[trafficLight] || 'bg-traffic-yellow'

  const isDefeated = trafficLight === 'well_done'

  return (
    <button
      onClick={() => navigate(`/battle/${encodeURIComponent(subject)}`)}
      className={`card-dark ${borderClass} p-4 w-full text-left transition-all active:scale-95 hover:scale-105`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-4xl ${isDefeated ? 'opacity-50 grayscale' : 'animate-float'}`}>
          {monster.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base">{subject}</span>
            <span className="text-xs opacity-50">{monster.name}</span>
          </div>
          <HPBar percent={hpPercent} trafficLight={trafficLight} showLabel={false} />
          <div className="flex justify-between text-xs mt-1 opacity-60">
            <span>当前 {currentGrade || '—'}</span>
            <span>目标 {targetGrade || '—'}</span>
          </div>
        </div>
        {isDefeated && (
          <div className="text-2xl" title="已攻克">✅</div>
        )}
      </div>
    </button>
  )
}

MonsterCard.MONSTERS = MONSTERS
