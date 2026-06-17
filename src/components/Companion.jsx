import { COMPANION_STAGES } from '../utils/xpSystem'

const LINES = {
  idle: ['今天想挑战哪一只怪兽？', '我在这儿陪你，别紧张！', '加油，英雄！'],
  cheer: ['进步了！这一击很漂亮！', '你越来越强了，继续保持！', '太棒了，感受到你的成长！'],
  celebrate: ['哇——你做到了！我就知道你可以！', '目标达成！今天你是大英雄！', '史诗级发挥！'],
  encourage: ['这一关有点硬，没关系，我们一起想办法。', '分数只是这一次，你还在变强。有我在，下次拿下它！', '每一次努力都算数，不要放弃！']
}

const SIZES = { sm: 'text-4xl', md: 'text-6xl', lg: 'text-8xl' }

export default function Companion({ stage = 'spark', state = 'idle', size = 'md', showLine = true, customLine }) {
  const stageInfo = COMPANION_STAGES[stage] || COMPANION_STAGES.spark
  const lines = LINES[state] || LINES.idle
  const line = customLine || lines[Math.floor(Math.random() * lines.length)]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${SIZES[size]} animate-float companion-${stage} select-none`}>
        {stageInfo.emoji}
      </div>
      {showLine && (
        <div className="card-dark px-4 py-2 max-w-xs text-center text-sm" style={{ color: stageInfo.color }}>
          <span className="font-bold">光光：</span>{line}
        </div>
      )}
    </div>
  )
}

Companion.LINES = LINES
