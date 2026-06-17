export function getLevelFromXP(xp) {
  return Math.floor((xp || 0) / 100) + 1
}

export function getXPForNextLevel(level) {
  return level * 100
}

export function getXPProgress(xp) {
  const level = getLevelFromXP(xp)
  const xpInCurrentLevel = xp % 100
  const xpNeeded = 100
  return { level, xpInCurrentLevel, xpNeeded, percent: Math.round((xpInCurrentLevel / xpNeeded) * 100) }
}

export function getLevelBand(level) {
  if (level <= 5) return '新手'
  if (level <= 15) return '进阶'
  if (level <= 25) return '高手'
  return '大师'
}

export function getCompanionStage(level) {
  if (level >= 20) return 'sun'
  if (level >= 10) return 'comet'
  if (level >= 5) return 'star'
  return 'spark'
}

export const COMPANION_STAGES = {
  spark: { name: '火花', emoji: '✨', color: '#fbbf24' },
  star:  { name: '星星', emoji: '⭐', color: '#34d399' },
  comet: { name: '彗星', emoji: '☄️', color: '#60a5fa' },
  sun:   { name: '太阳', emoji: '☀️', color: '#f97316' }
}
