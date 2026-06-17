const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  getConfig: () => request('/config'),
  updateConfig: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) }),

  teacherLogin: (password) => request('/auth/teacher', { method: 'POST', body: JSON.stringify({ password }) }),
  changeTeacherPassword: (currentPassword, newPassword) =>
    request('/auth/teacher/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  getStudents: () => request('/students'),
  createStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  getScores: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/scores${qs ? '?' + qs : ''}`)
  },
  submitScore: (data) => request('/scores', { method: 'POST', body: JSON.stringify(data) }),

  getStrategies: () => request('/strategies'),
  createStrategy: (data) => request('/strategies', { method: 'POST', body: JSON.stringify(data) }),
  updateStrategy: (id, data) => request(`/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStrategy: (id) => request(`/strategies/${id}`, { method: 'DELETE' }),

  getItems: () => request('/items'),

  getActivity: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/activity${qs ? '?' + qs : ''}`)
  },

  importExcel: (buffer) =>
    fetch(`${BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer
    }).then(r => r.json())
}
