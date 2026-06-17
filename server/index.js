import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import * as XLSX from 'xlsx'
import db from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())

// ── Helpers ───────────────────────────────────────────────
function studentFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    form: row.form,
    class: row.class,
    level: row.level,
    xp: row.xp,
    boxPity: row.box_pity,
    companionStage: row.companion_stage,
    targets: row.targets ?? {},
    inventory: row.inventory ?? []
  }
}

function scoreFromDb(row) {
  return {
    studentId: row.student_id,
    subject: row.subject,
    assessment: row.assessment,
    date: row.date,
    marks: row.marks,
    max: row.max,
    absent: row.absent
  }
}

function configFromDb(row) {
  return {
    assessments: row.assessments ?? [],
    gradeBands: row.grade_bands ?? [],
    failGrades: row.fail_grades ?? [],
    xpConfig: row.xp_config ?? {},
    blindBoxProbabilities: row.blind_box_probabilities ?? []
  }
}

function getGrade(pct, gradeBands) {
  for (const band of gradeBands) {
    if (pct >= band.min) return band.grade
  }
  return gradeBands[gradeBands.length - 1].grade
}

function getCompanionStage(level) {
  if (level >= 20) return 'sun'
  if (level >= 10) return 'comet'
  if (level >= 5) return 'star'
  return 'spark'
}

function rollBlindBox(student, config, isImprovement) {
  const level = student.level || 1
  const bands = config.blind_box_probabilities ?? config.blindBoxProbabilities
  let band = bands[0]
  for (const b of bands) {
    if (level >= b.minLevel && level <= b.maxLevel) { band = b; break }
  }

  let probs = { '普通': band['普通'], '稀有': band['稀有'], '史诗': band['史诗'], '传说': band['传说'], '神话': band['神话'] }

  if (isImprovement) {
    const idx = bands.indexOf(band)
    if (idx < bands.length - 1) {
      const nextBand = bands[idx + 1]
      probs = { '普通': nextBand['普通'], '稀有': nextBand['稀有'], '史诗': nextBand['史诗'], '传说': nextBand['传说'], '神话': nextBand['神话'] }
    }
  }

  const pity = student.box_pity ?? student.boxPity ?? 0

  if (pity >= 10) return { rarity: '史诗', newPity: 0 }

  if (pity >= 6) {
    const boost = (pity - 5) * 5
    probs['史诗'] = Math.min(probs['史诗'] + boost, 40)
    probs['普通'] = Math.max(probs['普通'] - boost, 0)
  }

  const roll = Math.random() * 100
  let cumulative = 0
  for (const rarity of ['神话', '传说', '史诗', '稀有', '普通']) {
    cumulative += probs[rarity]
    if (roll < cumulative) {
      const isEpicPlus = ['史诗', '传说', '神话'].includes(rarity)
      return { rarity, newPity: isEpicPlus ? 0 : pity + 1 }
    }
  }
  return { rarity: '普通', newPity: pity + 1 }
}

function pickItem(items, rarity) {
  const pool = items.filter(i => i.rarity === rarity)
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

async function log(action_type, student_id, details = {}) {
  await db.from('activity_log').insert({ action_type, student_id: student_id || null, details })
}

// ── Config ──────────────────────────────────────────────
app.get('/api/config', async (req, res) => {
  const { data, error } = await db.from('config').select('*').single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(configFromDb(data))
})

app.put('/api/config', async (req, res) => {
  const { teacherPasswordHash, ...updates } = req.body
  const dbUpdates = {}
  if (updates.assessments !== undefined) dbUpdates.assessments = updates.assessments
  if (updates.gradeBands !== undefined) dbUpdates.grade_bands = updates.gradeBands
  if (updates.failGrades !== undefined) dbUpdates.fail_grades = updates.failGrades
  if (updates.xpConfig !== undefined) dbUpdates.xp_config = updates.xpConfig
  if (updates.blindBoxProbabilities !== undefined) dbUpdates.blind_box_probabilities = updates.blindBoxProbabilities
  const { error } = await db.from('config').update(dbUpdates).eq('id', 1)
  if (error) return res.status(500).json({ error: error.message })
  await log('config_updated', null, { fields: Object.keys(dbUpdates) })
  res.json({ ok: true })
})

// ── Auth ─────────────────────────────────────────────────
app.post('/api/auth/teacher', async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: '需要密码' })
  const { data, error } = await db.from('config').select('teacher_password_hash').single()
  if (error) return res.status(500).json({ error: error.message })
  const valid = bcrypt.compareSync(password, data.teacher_password_hash)
  if (!valid) return res.status(401).json({ error: '密码错误' })
  await log('teacher_login', null)
  res.json({ ok: true, token: 'teacher-session' })
})

app.post('/api/auth/teacher/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const { data } = await db.from('config').select('teacher_password_hash').single()
  if (!bcrypt.compareSync(currentPassword, data.teacher_password_hash)) {
    return res.status(401).json({ error: '当前密码错误' })
  }
  const hash = bcrypt.hashSync(newPassword, 10)
  await db.from('config').update({ teacher_password_hash: hash }).eq('id', 1)
  res.json({ ok: true })
})

// ── Students ──────────────────────────────────────────────
app.get('/api/students', async (req, res) => {
  const { data, error } = await db.from('students').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.map(studentFromDb))
})

app.post('/api/students', async (req, res) => {
  const student = {
    id: `s${Date.now()}`,
    level: 1, xp: 0, box_pity: 0, inventory: [], companion_stage: 'spark',
    name: req.body.name,
    form: req.body.form ?? 4,
    class: req.body.class ?? '',
    targets: req.body.targets ?? {}
  }
  const { data, error } = await db.from('students').insert(student).select().single()
  if (error) return res.status(500).json({ error: error.message })
  await log('student_created', data.id, { name: data.name })
  res.json(studentFromDb(data))
})

app.put('/api/students/:id', async (req, res) => {
  const updates = {}
  const b = req.body
  if (b.name !== undefined) updates.name = b.name
  if (b.form !== undefined) updates.form = b.form
  if (b.class !== undefined) updates.class = b.class
  if (b.level !== undefined) updates.level = b.level
  if (b.xp !== undefined) updates.xp = b.xp
  if (b.boxPity !== undefined) updates.box_pity = b.boxPity
  if (b.companionStage !== undefined) updates.companion_stage = b.companionStage
  if (b.targets !== undefined) updates.targets = b.targets
  if (b.inventory !== undefined) updates.inventory = b.inventory
  const { data, error } = await db.from('students').update(updates).eq('id', req.params.id).select().single()
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message })
  res.json(studentFromDb(data))
})

app.delete('/api/students/:id', async (req, res) => {
  await log('student_deleted', req.params.id)
  const { error } = await db.from('students').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ── Scores ────────────────────────────────────────────────
app.get('/api/scores', async (req, res) => {
  let query = db.from('scores').select('*')
  if (req.query.studentId) query = query.eq('student_id', req.query.studentId)
  if (req.query.subject) query = query.eq('subject', req.query.subject)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data.map(scoreFromDb))
})

app.post('/api/scores', async (req, res) => {
  const { studentId, subject, assessment, date, marks, max, absent } = req.body
  if (!studentId || !subject || !assessment) {
    return res.status(400).json({ error: '缺少必要字段' })
  }

  const scoreRow = {
    student_id: studentId,
    subject,
    assessment,
    date: date || new Date().toISOString().split('T')[0],
    marks,
    max: max ?? 100,
    absent: !!absent
  }

  const { error: upsertErr } = await db.from('scores')
    .upsert(scoreRow, { onConflict: 'student_id,subject,assessment' })
  if (upsertErr) return res.status(500).json({ error: upsertErr.message })

  let xpGained = 0
  let boxes = []

  if (!absent) {
    const [{ data: studentRow }, { data: configRow }, { data: prevScoreRows }, { data: itemRows }] = await Promise.all([
      db.from('students').select('*').eq('id', studentId).single(),
      db.from('config').select('*').single(),
      db.from('scores').select('*').eq('student_id', studentId).eq('subject', subject).eq('absent', false).neq('assessment', assessment),
      db.from('items').select('*')
    ])

    if (studentRow && configRow) {
      const xpCfg = configRow.xp_config
      const assessmentOrder = configRow.assessments ?? []
      xpGained += xpCfg.completeAssessment

      const prevSorted = (prevScoreRows ?? []).sort((a, b) =>
        assessmentOrder.indexOf(a.assessment) - assessmentOrder.indexOf(b.assessment)
      )
      const prevScore = prevSorted[prevSorted.length - 1]

      const pct = marks / (max ?? 100) * 100
      const prevPct = prevScore ? prevScore.marks / prevScore.max * 100 : null
      const isImprovement = prevPct !== null && pct > prevPct

      if (isImprovement) xpGained += xpCfg.improvedResult

      const target = studentRow.targets?.[subject]
      const currentGrade = getGrade(pct, configRow.grade_bands)
      const gradeBands = configRow.grade_bands
      const targetIdx = gradeBands.findIndex(b => b.grade === target)
      const currentIdx = gradeBands.findIndex(b => b.grade === currentGrade)
      const hitTarget = target && currentIdx <= targetIdx

      if (hitTarget) xpGained += xpCfg.hitTarget

      const newXP = (studentRow.xp || 0) + xpGained
      const prevLevel = studentRow.level || 1
      const newLevel = Math.floor(newXP / 100) + 1
      const newCompanionStage = getCompanionStage(newLevel)

      const numBoxes = hitTarget ? 2 : 1
      const currentInventory = [...(studentRow.inventory ?? [])]
      let currentPity = studentRow.box_pity ?? 0

      for (let i = 0; i < numBoxes; i++) {
        const tempStudent = { level: newLevel, box_pity: currentPity }
        const result = rollBlindBox(tempStudent, configRow, isImprovement && i === 0)
        const item = pickItem(itemRows ?? [], result.rarity)
        boxes.push({ rarity: result.rarity, item, pity: result.newPity })
        currentPity = result.newPity
        if (item) currentInventory.push(item.id)
      }

      await db.from('students').update({
        xp: newXP,
        level: newLevel,
        companion_stage: newCompanionStage,
        box_pity: currentPity,
        inventory: currentInventory
      }).eq('id', studentId)

      await log('score_submitted', studentId, { subject, assessment, marks, max, xpGained, boxes: boxes.map(b => b.rarity) })
      if (newLevel > prevLevel) {
        await log('level_up', studentId, { from: prevLevel, to: newLevel })
      }
    }
  }

  res.json({ score: scoreFromDb(scoreRow), xpGained, boxes })
})

// ── Strategies ────────────────────────────────────────────
app.get('/api/strategies', async (req, res) => {
  const { data, error } = await db.from('strategies').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/strategies', async (req, res) => {
  const strategy = { id: `st_${Date.now()}`, ...req.body }
  const { data, error } = await db.from('strategies').insert(strategy).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.put('/api/strategies/:id', async (req, res) => {
  const { data, error } = await db.from('strategies').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message })
  res.json(data)
})

app.delete('/api/strategies/:id', async (req, res) => {
  const { error } = await db.from('strategies').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// ── Items ─────────────────────────────────────────────────
app.get('/api/items', async (req, res) => {
  const { data, error } = await db.from('items').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ── Activity Log ──────────────────────────────────────────
app.get('/api/activity', async (req, res) => {
  let query = db.from('activity_log')
    .select('*, students(name)')
    .order('created_at', { ascending: false })
    .limit(500)
  if (req.query.studentId) query = query.eq('student_id', req.query.studentId)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ── Excel Import ──────────────────────────────────────────
app.post('/api/import', express.raw({ type: 'application/octet-stream', limit: '10mb' }), async (req, res) => {
  try {
    const wb = XLSX.read(req.body, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    const { data: existingStudents } = await db.from('students').select('*')
    const studentMap = new Map(existingStudents.map(s => [s.name, s]))

    let added = 0
    for (const row of rows) {
      const studentName = row['姓名'] || row['Name'] || row['Student']
      const subject = row['科目'] || row['Subject']
      const assessment = row['评估'] || row['Assessment']
      const marks = Number(row['分数'] || row['Marks'] || 0)
      const max = Number(row['总分'] || row['Max'] || 100)
      const dateStr = row['日期'] || row['Date'] || new Date().toISOString().split('T')[0]

      if (!studentName || !subject || !assessment) continue

      let student = studentMap.get(studentName)
      if (!student) {
        const newStudent = {
          id: `s${Date.now()}_${added}`,
          name: studentName,
          form: Number(row['Form'] || row['班级'] || 4),
          class: row['Class'] || row['班'] || '',
          targets: {},
          level: 1, xp: 0, box_pity: 0, inventory: [], companion_stage: 'spark'
        }
        const { data } = await db.from('students').insert(newStudent).select().single()
        student = data
        studentMap.set(studentName, student)
      }

      await db.from('scores').upsert({
        student_id: student.id, subject, assessment,
        date: String(dateStr), marks, max: max, absent: false
      }, { onConflict: 'student_id,subject,assessment' })
      added++
    }

    await log('excel_import', null, { rows: added })
    res.json({ ok: true, added })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ── Serve frontend in production ──────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist')
  if (existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (req, res) => res.sendFile(join(distPath, 'index.html')))
  }
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Catalyst Quest server running on http://localhost:${PORT}`))
