import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import ReportIssue from './pages/ReportIssue'
import IssueDetail from './pages/IssueDetail'
import AuthorityDashboard from './pages/AuthorityDashboard'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
  </div>
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
        <Route path="issues/:id" element={<ProtectedRoute><IssueDetail /></ProtectedRoute>} />
        <Route path="authority" element={<ProtectedRoute roles={['authority', 'admin']}><AuthorityDashboard /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
