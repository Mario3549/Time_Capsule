import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navigation from './components/Navigation'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import CreateCapsule from './pages/CreateCapsule'
import CreateMultiCapsule from './pages/CreateMultiCapsule'
import CapsuleVault from './pages/CapsuleVault'
import CapsuleView from './pages/CapsuleView'
import Memories from './pages/Memories'
// PublicCapsules removed in v4 (no public capsule browsing)
import Profile from './pages/Profile'
import CollaborationPage from './pages/CollaborationPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import EmailVerification from './pages/EmailVerification'
import CollaborationRespond from './pages/CollaborationRespond'
import Landing from './pages/Landing'
import { ThemeProvider } from './context/ThemeContext'
import { CapsuleProvider } from './context/CapsuleContext'

function App() {
  const location = useLocation()
  
  // Hide navigation on login/signup pages and home page when not logged in
  const shouldHideNavigation =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/verify-email' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password'
  
  return (
    <ThemeProvider>
      <CapsuleProvider>
        <div className="min-h-screen theme-bg">
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '16px 24px',
                fontSize: '16px',
                fontWeight: '500',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                minWidth: '300px',
                maxWidth: '500px',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                overflow: 'visible',
                zIndex: 9999,
              },
            }}
            containerClassName="toast-container"
          />
          <ScrollToTop />
          {!shouldHideNavigation && <Navigation />}
          <main className={shouldHideNavigation ? "" : "pt-16"}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/invite/respond" element={<CollaborationRespond />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/create" element={
                <ProtectedRoute>
                  <CreateCapsule />
                </ProtectedRoute>
              } />
              <Route path="/create-multi" element={
                <ProtectedRoute>
                  <CreateMultiCapsule />
                </ProtectedRoute>
              } />
              <Route path="/vault" element={
                <ProtectedRoute>
                  <CapsuleVault />
                </ProtectedRoute>
              } />
              <Route path="/capsule/:id" element={
                <ProtectedRoute>
                  <CapsuleView />
                </ProtectedRoute>
              } />
              <Route path="/memories" element={
                <ProtectedRoute>
                  <Memories />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/collaboration/:id" element={
                <ProtectedRoute>
                  <CollaborationPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </CapsuleProvider>
    </ThemeProvider>
  )
}

export default App 