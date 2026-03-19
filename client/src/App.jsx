import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useStore from './store/useStore'

import SplashLoader from './components/SplashLoader'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/ToastContainer'
import { ToastProvider } from './context/ToastContext'
import { Header } from './components/ui/header-3'

import Home from './pages/Home'
import Workflow from './pages/Workflow'
import Templates from './pages/Templates'
import Build from './pages/Build'
import BuildDemo from './pages/BuildDemo'
import SignIn from './pages/SignIn'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import AdminDashboard from './pages/AdminDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StudentChoice from './pages/StudentChoice'
import ViewResumes from './pages/ViewResumes'
import MasterProfile from './pages/MasterProfile'
import UploadResume from './pages/UploadResume'
import CoverLetterBuilder from './pages/CoverLetterBuilder'
import Placeholder from './pages/Placeholder'
import JobBoard from './pages/JobBoard'

const ProtectedRoute = ({ children, role }) => {
  const { user, hasHydrated } = useStore()
  
  if (!hasHydrated) return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: window.location.pathname }} />
  }
  
  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function AnimatedRoutes() {
  const location = useLocation()
  const { user } = useStore()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/faq" element={<Placeholder />} />
        <Route path="/support" element={<Placeholder />} />
        <Route
          path="/templates"
          element={
            <ProtectedRoute role="student">
              <Templates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/build"
          element={
            <ProtectedRoute role="student">
              <Build />
            </ProtectedRoute>
          }
        />
        <Route path="/build-demo" element={<BuildDemo />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/choice"
          element={
            <ProtectedRoute role="student">
              <StudentChoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-resumes"
          element={
            <ProtectedRoute role="student">
              <ViewResumes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-profile"
          element={
            <ProtectedRoute role="student">
              <MasterProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-resume"
          element={
            <ProtectedRoute role="student">
              <UploadResume />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute role="student">
              <CoverLetterBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-board"
          element={
            <ProtectedRoute role="student">
              <JobBoard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const theme = useStore((state) => state.theme)
  const hasHydrated = useStore((state) => state.hasHydrated)
  const user = useStore((state) => state.user)
  const restoreUserFromFallback = useStore((state) => state.restoreUserFromFallback)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        const nav = p + (Math.random() * 8 + 4)
        if (nav >= 100) {
          clearInterval(interval)
          setTimeout(() => setLoading(false), 200)
          return 100
        }
        return nav
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (hasHydrated && !user) {
      restoreUserFromFallback()
    }
  }, [hasHydrated, user, restoreUserFromFallback])

  if (loading) return <SplashLoader progress={progress} />

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Header />
          <AnimatedRoutes />
          <ToastContainer />
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
