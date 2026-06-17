// Returns 'improving' | 'declining' | 'flat' | 'volatile' | 'new'
export function getTrend(scores, studentId, subject, assessmentOrder) {
  const entries = scores
    .filter(s => s.studentId === studentId && s.subject === subject && !s.absent)
    .sort((a, b) => {
      const ai = assessmentOrder.indexOf(a.assessment)
      const bi = assessmentOrder.indexOf(b.assessment)
      return ai - bi
    })
    .map(s => (s.marks / s.max) * 100)

  if (entries.length < 2) return 'new'

  const last = entries[entries.length - 1]
  const prev = entries[entries.length - 2]

  if (entries.length >= 3) {
    const directions = []
    for (let i = 1; i < entries.length; i++) {
      directions.push(entries[i] > entries[i - 1] ? 1 : entries[i] < entries[i - 1] ? -1 : 0)
    }
    const alternating = directions.every((d, i) => i === 0 || (d !== 0 && d !== directions[i - 1]))
    if (alternating && directions.some(d => d !== 0)) return 'volatile'
  }

  const diff = last - prev
  if (Math.abs(diff) <= 2) return 'flat'
  return diff > 0 ? 'improving' : 'declining'
}

export function getCompanionState(trafficLight, trend, isNewResult) {
  if (!isNewResult) return 'idle'
  if (trafficLight === 'well_done') return 'celebrate'
  if (trend === 'improving') return 'cheer'
  if (trafficLight === 'priority') return 'encourage'
  if (trend === 'declining') return 'encourage'
  return 'cheer'
}
