// Run once to migrate data.json → Supabase
// Usage: node server/seed.js
import 'dotenv/config'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import db from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const raw = JSON.parse(readFileSync(join(__dirname, 'data.json'), 'utf8'))

async function seed() {
  console.log('Seeding config...')
  const { error: cfgErr } = await db.from('config').upsert({
    id: 1,
    assessments: raw.config.assessments,
    grade_bands: raw.config.gradeBands,
    fail_grades: raw.config.failGrades,
    xp_config: raw.config.xpConfig,
    blind_box_probabilities: raw.config.blindBoxProbabilities,
    teacher_password_hash: raw.config.teacherPasswordHash
  })
  if (cfgErr) { console.error('Config error:', cfgErr.message); process.exit(1) }

  console.log(`Seeding ${raw.students.length} students...`)
  for (const s of raw.students) {
    const { error } = await db.from('students').upsert({
      id: s.id,
      name: s.name,
      form: s.form ?? 4,
      class: s.class ?? '',
      level: s.level ?? 1,
      xp: s.xp ?? 0,
      box_pity: s.boxPity ?? 0,
      companion_stage: s.companionStage ?? 'spark',
      targets: s.targets ?? {},
      inventory: s.inventory ?? []
    })
    if (error) console.error(`  Student ${s.name}:`, error.message)
  }

  console.log(`Seeding ${raw.scores.length} scores...`)
  for (const sc of raw.scores) {
    const { error } = await db.from('scores').upsert({
      student_id: sc.studentId,
      subject: sc.subject,
      assessment: sc.assessment,
      date: sc.date,
      marks: sc.marks,
      max: sc.max,
      absent: sc.absent ?? false
    }, { onConflict: 'student_id,subject,assessment' })
    if (error) console.error(`  Score error:`, error.message)
  }

  console.log(`Seeding ${raw.strategies.length} strategies...`)
  for (const st of raw.strategies) {
    const { error } = await db.from('strategies').upsert({
      id: st.id,
      subject: st.subject,
      topic_hint: st.topicHint,
      text: st.text,
      source: st.source
    })
    if (error) console.error(`  Strategy ${st.id}:`, error.message)
  }

  console.log(`Seeding ${raw.items.length} items...`)
  for (const item of raw.items) {
    const { error } = await db.from('items').upsert({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      emoji: item.emoji,
      description: item.description
    })
    if (error) console.error(`  Item ${item.id}:`, error.message)
  }

  console.log('Done! All data migrated to Supabase.')
}

seed().catch(e => { console.error(e); process.exit(1) })
