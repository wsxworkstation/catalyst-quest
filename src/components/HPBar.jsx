const COLOR = {
  well_done: '#4ade80',
  almost: '#fbbf24',
  priority: '#f87171'
}

export default function HPBar({ percent, trafficLight = 'almost', label, showLabel = true }) {
  const color = COLOR[trafficLight] || COLOR.almost
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1 opacity-70">
          <span>{label || 'HP'}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}88`
          }}
        />
      </div>
    </div>
  )
}
