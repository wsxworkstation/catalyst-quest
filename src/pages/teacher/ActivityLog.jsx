import { useState, useEffect } from 'react'
import TeacherNav from '../../components/TeacherNav'
import { api } from '../../api/client'

const ACTION_LABELS = {
  score_submitted: '📝 提交成绩',
  level_up: '⬆️ 升级',
  student_created: '➕ 新增学生',
  student_deleted: '🗑️ 删除学生',
  teacher_login: '🔐 教师登录',
  config_updated: '⚙️ 更新设置',
  excel_import: '📥 导入Excel',
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function DetailBadge({ details, action }) {
  if (action === 'score_submitted') {
    return (
      <span className="text-white/50 text-xs">
        {details.subject} · {details.assessment} · {details.marks}/{details.max} · +{details.xpGained}XP
      </span>
    )
  }
  if (action === 'level_up') {
    return <span className="text-violet-400 text-xs">Lv{details.from} → Lv{details.to}</span>
  }
  if (action === 'student_created') {
    return <span className="text-green-400 text-xs">{details.name}</span>
  }
  if (action === 'excel_import') {
    return <span className="text-blue-400 text-xs">{details.rows} 条记录</span>
  }
  return null
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.getActivity().then(data => { setLogs(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action_type === filter)

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg,#0f0a1e 0%,#1a0a2e 100%)' }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-1">活动记录</h1>
        <p className="text-white/40 text-sm mb-4">所有学生操作与系统事件</p>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-4">
          {['all', 'score_submitted', 'level_up', 'student_created'].map(key => (
            <button key={key} onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1 rounded-full border ${filter === key ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/20 text-white/50'}`}>
              {key === 'all' ? '全部' : ACTION_LABELS[key]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-white/40 text-center py-12">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-white/40 text-center py-12">暂无记录</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(log => (
              <div key={log.id} className="rounded-xl p-3 flex items-start gap-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">
                      {ACTION_LABELS[log.action_type] || log.action_type}
                    </span>
                    {log.students?.name && (
                      <span className="text-violet-300 text-xs">{log.students.name}</span>
                    )}
                  </div>
                  <DetailBadge details={log.details || {}} action={log.action_type} />
                </div>
                <span className="text-white/30 text-xs shrink-0">{formatTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <TeacherNav />
    </div>
  )
}
