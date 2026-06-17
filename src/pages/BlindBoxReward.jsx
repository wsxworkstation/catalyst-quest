import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Companion from '../components/Companion'
import { useApp } from '../contexts/AppContext'
import { api } from '../api/client'

const RARITY_LABEL = { '普通': 'COMMON', '稀有': 'RARE', '史诗': 'EPIC', '传说': 'LEGENDARY', '神话': 'MYTHIC' }
const RARITY_CLASS = { '普通': 'rarity-bg-common rarity-common', '稀有': 'rarity-bg-rare rarity-rare', '史诗': 'rarity-bg-epic rarity-epic', '传说': 'rarity-bg-legendary rarity-legendary', '神话': 'rarity-bg-mythic rarity-mythic' }

function BoxOpener({ box, index, onOpen }) {
  const [opened, setOpened] = useState(false)

  const open = () => {
    setOpened(true)
    onOpen()
  }

  if (!opened) {
    return (
      <button
        onClick={open}
        className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 animate-shake"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 30px rgba(124,58,237,0.6)' }}
      >
        <span className="text-4xl">🎁</span>
        <span className="text-white/70 text-xs">点击开启</span>
      </button>
    )
  }

  const rarityClass = RARITY_CLASS[box.rarity] || RARITY_CLASS['普通']
  return (
    <div className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center gap-1 animate-pop-in ${rarityClass}`}>
      <span className="text-4xl">{box.item?.emoji || '✨'}</span>
      <span className="text-xs font-bold">{RARITY_LABEL[box.rarity]}</span>
      <span className="text-xs opacity-80 text-center px-1 leading-tight">{box.item?.name || '神秘物品'}</span>
    </div>
  )
}

export default function BlindBoxReward() {
  const location = useLocation()
  const navigate = useNavigate()
  const { student, refreshStudent } = useApp()
  const state = location.state || {}
  const { boxes = [], xpGained = 0 } = state

  const [openedCount, setOpenedCount] = useState(0)

  useEffect(() => {
    // Refresh student from server to get updated XP/level
    if (!student) return
    api.getStudents().then(all => {
      const fresh = all.find(s => s.id === student.id)
      if (fresh) refreshStudent(fresh)
    })
  }, [])

  if (!boxes.length) {
    navigate('/map')
    return null
  }

  const allOpened = openedCount >= boxes.length

  const companionState = boxes.some(b => ['神话', '传说', '史诗'].includes(b.rarity))
    ? 'celebrate'
    : 'cheer'

  return (
    <div className="bg-space min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
      <h2 className="text-2xl font-bold text-white mb-2">🎁 盲盒奖励！</h2>

      {xpGained > 0 && (
        <div className="mb-4 px-4 py-2 rounded-full text-sm font-bold animate-slide-up"
          style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}>
          +{xpGained} XP 获得！
        </div>
      )}

      <Companion
        stage={student?.companionStage || 'spark'}
        state={allOpened ? companionState : 'idle'}
        size="md"
      />

      <div className="flex gap-4 justify-center mt-6 flex-wrap">
        {boxes.map((box, i) => (
          <BoxOpener
            key={i}
            box={box}
            index={i}
            onOpen={() => setOpenedCount(c => c + 1)}
          />
        ))}
      </div>

      {openedCount > 0 && (
        <div className="mt-6 animate-slide-up flex flex-col gap-3 w-full max-w-xs">
          {boxes.slice(0, openedCount).map((box, i) => (
            <div key={i} className={`rounded-xl p-3 text-left flex items-center gap-3 ${RARITY_CLASS[box.rarity] || ''}`}>
              <span className="text-3xl">{box.item?.emoji || '✨'}</span>
              <div>
                <div className="font-bold text-sm">{box.item?.name || '神秘物品'}</div>
                <div className="text-xs opacity-60">{box.item?.description || ''}</div>
              </div>
              <span className="ml-auto text-xs font-bold opacity-70">{RARITY_LABEL[box.rarity]}</span>
            </div>
          ))}
        </div>
      )}

      {allOpened && (
        <button
          onClick={() => navigate('/map')}
          className="mt-8 px-8 py-3 rounded-2xl text-white font-bold animate-slide-up"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          返回地图 →
        </button>
      )}
    </div>
  )
}
