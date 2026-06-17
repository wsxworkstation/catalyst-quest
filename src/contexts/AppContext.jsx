import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [student, setStudent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cq_student')) } catch { return null }
  })
  const [isTeacher, setIsTeacher] = useState(() => !!localStorage.getItem('cq_teacher'))
  const [config, setConfig] = useState(null)

  const loginStudent = (studentData) => {
    setStudent(studentData)
    localStorage.setItem('cq_student', JSON.stringify(studentData))
  }

  const logoutStudent = () => {
    setStudent(null)
    localStorage.removeItem('cq_student')
  }

  const refreshStudent = (updatedStudent) => {
    setStudent(updatedStudent)
    localStorage.setItem('cq_student', JSON.stringify(updatedStudent))
  }

  const loginTeacher = () => {
    setIsTeacher(true)
    localStorage.setItem('cq_teacher', '1')
  }

  const logoutTeacher = () => {
    setIsTeacher(false)
    localStorage.removeItem('cq_teacher')
  }

  return (
    <AppContext.Provider value={{ student, loginStudent, logoutStudent, refreshStudent, isTeacher, loginTeacher, logoutTeacher, config, setConfig }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
