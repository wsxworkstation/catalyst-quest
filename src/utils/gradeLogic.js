export function getPercentage(marks, max) {
  if (!max || max === 0) return 0
  return (marks / max) * 100
}

export function getGrade(pct, gradeBands) {
  for (const band of gradeBands) {
    if (pct >= band.min) return band.grade
  }
  return gradeBands[gradeBands.length - 1].grade
}

export function getGradeIndex(grade, gradeBands) {
  return gradeBands.findIndex(b => b.grade === grade)
}

// gap > 0 means below target; gap = 0 means at/above target
export function getGap(currentGrade, targetGrade, gradeBands) {
  const currentIdx = getGradeIndex(currentGrade, gradeBands)
  const targetIdx = getGradeIndex(targetGrade, gradeBands)
  if (currentIdx === -1 || targetIdx === -1) return 0
  return currentIdx - targetIdx
}

// 'well_done' | 'almost' | 'priority'
export function getTrafficLight(currentGrade, targetGrade, gradeBands, failGrades) {
  if (failGrades.includes(currentGrade)) return 'priority'
  const gap = getGap(currentGrade, targetGrade, gradeBands)
  if (gap <= 0) return 'well_done'
  if (gap === 1) return 'almost'
  return 'priority'
}

export function getHPPercent(currentGrade, targetGrade, gradeBands) {
  const gap = getGap(currentGrade, targetGrade, gradeBands)
  const maxGap = gradeBands.length - 1
  const clamped = Math.max(0, Math.min(gap, maxGap))
  return Math.round((1 - clamped / maxGap) * 100)
}

// Returns the most recent non-absent score for a subject
export function getCurrentScore(scores, studentId, subject) {
  const entries = scores
    .filter(s => s.studentId === studentId && s.subject === subject && !s.absent)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  return entries[0] || null
}

// Sort scores by assessment order from config
export function sortByAssessment(scores, assessmentOrder) {
  return [...scores].sort((a, b) => {
    const ai = assessmentOrder.indexOf(a.assessment)
    const bi = assessmentOrder.indexOf(b.assessment)
    return ai - bi
  })
}
