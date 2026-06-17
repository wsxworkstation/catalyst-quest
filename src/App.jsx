import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './contexts/AppContext'
import NavBar from './components/NavBar'

import Title from './pages/Title'
import SignIn from './pages/SignIn'
import PickForm from './pages/PickForm'
import Map from './pages/Map'
import Battle from './pages/Battle'
import MarksEntry from './pages/MarksEntry'
import BlindBoxReward from './pages/BlindBoxReward'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import WinsWall from './pages/WinsWall'

import TeacherLogin from './pages/teacher/TeacherLogin'
import CommandCentre from './pages/teacher/CommandCentre'
import ClassAnalytics from './pages/teacher/ClassAnalytics'
import Roster from './pages/teacher/Roster'
import Setup from './pages/teacher/Setup'
import StrategyLibrary from './pages/teacher/StrategyLibrary'
import ActivityLog from './pages/teacher/ActivityLog'

function StudentGuard({ children }) {
  const { student } = useApp()
  if (!student) return <Navigate to="/signin" replace />
  return children
}

function TeacherGuard({ children }) {
  const { isTeacher } = useApp()
  if (!isTeacher) return <Navigate to="/teacher" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Title />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/form" element={<PickForm />} />
        <Route path="/map" element={<StudentGuard><Map /></StudentGuard>} />
        <Route path="/battle/:subject" element={<StudentGuard><Battle /></StudentGuard>} />
        <Route path="/marks/:subject" element={<StudentGuard><MarksEntry /></StudentGuard>} />
        <Route path="/reward" element={<StudentGuard><BlindBoxReward /></StudentGuard>} />
        <Route path="/progress" element={<StudentGuard><Progress /></StudentGuard>} />
        <Route path="/profile" element={<StudentGuard><Profile /></StudentGuard>} />
        <Route path="/wins" element={<StudentGuard><WinsWall /></StudentGuard>} />

        <Route path="/teacher" element={<TeacherLogin />} />
        <Route path="/teacher/command" element={<TeacherGuard><CommandCentre /></TeacherGuard>} />
        <Route path="/teacher/analytics" element={<TeacherGuard><ClassAnalytics /></TeacherGuard>} />
        <Route path="/teacher/roster" element={<TeacherGuard><Roster /></TeacherGuard>} />
        <Route path="/teacher/setup" element={<TeacherGuard><Setup /></TeacherGuard>} />
        <Route path="/teacher/strategies" element={<TeacherGuard><StrategyLibrary /></TeacherGuard>} />
        <Route path="/teacher/activity" element={<TeacherGuard><ActivityLog /></TeacherGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NavBar />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
