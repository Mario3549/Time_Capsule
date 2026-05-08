import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Plus, 
  Users, 
  Lock, 
  Heart, 
  User, 
  Menu, 
  X,
  Sun,
  Moon,
  LogIn,
  Bell,
  Check,
  Ban
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'
import api from '../services/api'
import toast from 'react-hot-toast'

const Navigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, resolvedTheme, toggleTheme, setThemeMode } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [isRequestsOpen, setIsRequestsOpen] = useState(false)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [requestAction, setRequestAction] = useState({})
  const [recentNotif, setRecentNotif] = useState([])
  const lastRequestCountRef = React.useRef(0)

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user') || localStorage.getItem('userData')
    
    if (token && userData) {
      setIsLoggedIn(true)
      try {
        setUser(JSON.parse(userData))
      } catch {
        setUser(null)
      }
    } else {
      setIsLoggedIn(false)
      setUser(null)
    }
  }, [location.pathname]) // Re-check when route changes

  // Load recent notification activity (approve/reject confirmations)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentCollabNotifications')
      const parsed = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) setRecentNotif(parsed)
    } catch {
      setRecentNotif([])
    }
  }, [isLoggedIn])

  const pushRecentNotif = (entry) => {
    const nextEntry = {
      id: entry && entry.id ? entry.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: entry && entry.type ? entry.type : 'info',
      text: entry && entry.text ? entry.text : '',
      at: entry && entry.at ? entry.at : Date.now()
    }
    setRecentNotif((prev) => {
      const next = [nextEntry, ...(Array.isArray(prev) ? prev : [])].slice(0, 8)
      try {
        localStorage.setItem('recentCollabNotifications', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const loadCollaborationRequests = async () => {
    if (!isLoggedIn) return
    try {
      setLoadingRequests(true)
      const res = await api.listCollaborationRequests()
      const nextRequests = res.requests || []
      const prevCount = lastRequestCountRef.current
      setRequests(nextRequests)
      setRequestAction((prev) => {
        const next = { ...prev }
        for (const k of Object.keys(next)) {
          const exists = nextRequests.some((r) => (r && r.token) === k)
          if (!exists) delete next[k]
        }
        return next
      })
      if (prevCount > 0 && nextRequests.length > prevCount) {
        toast.success(`You have ${nextRequests.length} pending collaboration request${nextRequests.length > 1 ? 's' : ''}`)
      }
      lastRequestCountRef.current = nextRequests.length
    } catch {
      setRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return
    lastRequestCountRef.current = 0
    loadCollaborationRequests()
    const id = setInterval(loadCollaborationRequests, 30000)
    return () => clearInterval(id)
  }, [isLoggedIn, location.pathname])

  // Hide navigation on login/signup pages and home page when not logged in
  const shouldHideNavigation = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/verify-email'

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    navigate('/', { replace: true })
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = isLoggedIn ? [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/create', label: 'Create', icon: Plus },
    { path: '/create-multi', label: 'Multi', icon: Users },
    { path: '/vault', label: 'Vault', icon: Lock },
    { path: '/memories', label: 'Memories', icon: Heart },
    { path: '/profile', label: 'Profile', icon: User },
  ] : [
    { path: '/', label: 'Home', icon: Home },
    { path: '/login', label: 'Login', icon: LogIn },
    { path: '/signup', label: 'Sign Up', icon: User },
  ]

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />
      case 'dark':
        return <Moon className="h-5 w-5" />
      default:
        return <Sun className="h-5 w-5" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      default:
        return 'Light'
    }
  }

  // Don't render navigation on login/signup pages
  if (shouldHideNavigation) {
    return null
  }

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'theme-nav shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        <div className="theme-container">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
            <Link to="/">
              <Logo size="default" />
            </Link>

            {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
                const isActive = location.pathname === item.path
                
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                        : 'theme-nav-link hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {!isLoggedIn && (
                <>
                  {/* Login Button */}
                  <Link
                    to="/login"
                    className="theme-btn-secondary flex items-center space-x-2 px-4 py-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                  
                  {/* Signup Button */}
                  <Link
                    to="/signup"
                    className="theme-btn-primary flex items-center space-x-2 px-4 py-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Link>
                </>
              )}

              {isLoggedIn && (
                <div className="relative">
                  <button
                    onClick={() => {
                      const next = !isRequestsOpen
                      setIsRequestsOpen(next)
                      if (next) loadCollaborationRequests()
                    }}
                    className="theme-btn-ghost rounded-xl p-2 relative"
                    title="Collaboration requests"
                  >
                    <Bell className="h-5 w-5" />
                    {requests.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {requests.length}
                      </span>
                    )}
                  </button>

                  {isRequestsOpen && (
                    <div className="absolute right-0 mt-2 w-80 max-w-[90vw] theme-card p-0 overflow-hidden z-50">
                      <div className="px-3 py-3 border-b theme-border bg-gradient-to-r from-primary-500/10 to-transparent dark:from-primary-400/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold theme-text">Collaboration Requests</h4>
                            <p className="text-xs theme-text-muted">
                              {requests.length > 0 ? `${requests.length} pending` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {loadingRequests ? (
                        <p className="text-sm theme-text-muted px-3 py-3">Loading...</p>
                      ) : (
                        <div className="max-h-80 overflow-auto p-3 space-y-4">
                          {requests.length === 0 ? (
                            <p className="text-sm theme-text-muted">No pending requests.</p>
                          ) : (
                            <div className="space-y-2">
                              {requests.map((req) => (
                            <div key={`${req.capsuleId}-${req.ownerEmail}`} className="rounded-xl border theme-border p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold theme-text truncate">{req.capsuleTitle}</p>
                                  <p className="text-xs theme-text-muted truncate">
                                    Invited by {req.ownerName || req.ownerEmail || 'Someone'}
                                  </p>
                                </div>
                                {requestAction[req.token] && requestAction[req.token].status !== 'idle' && (
                                  <span
                                    className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ${
                                      requestAction[req.token].status === 'approved'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : requestAction[req.token].status === 'rejected'
                                          ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                                          : 'bg-gray-500/15 text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    {requestAction[req.token].status === 'pending'
                                      ? 'Processing...'
                                      : requestAction[req.token].status === 'approved'
                                        ? 'Approved'
                                        : 'Rejected'}
                                  </span>
                                )}
                              </div>

                              {requestAction[req.token] && requestAction[req.token].message && (
                                <p className="mt-2 text-xs theme-text-muted">
                                  {requestAction[req.token].message}
                                </p>
                              )}

                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  disabled={requestAction[req.token] && requestAction[req.token].status === 'pending'}
                                  onClick={async () => {
                                    const token = req.token
                                    const title = req.capsuleTitle || 'this capsule'
                                    setRequestAction((prev) => ({
                                      ...prev,
                                      [token]: { status: 'pending', message: `Approving collaboration for ${title}...` }
                                    }))
                                    try {
                                      await api.respondCollaboration(token, 'approve')
                                      setRequestAction((prev) => ({
                                        ...prev,
                                        [token]: { status: 'approved', message: `Approved collaboration for ${title}.` }
                                      }))
                                      toast.success(`Approved: ${title}`)
                                      pushRecentNotif({
                                        type: 'approved',
                                        text: `You approved collaboration for ${title}.`,
                                      })
                                      setTimeout(() => {
                                        setRequests((prev) => prev.filter((r) => (r && r.token) !== token))
                                        setRequestAction((prev) => {
                                          const next = { ...prev }
                                          delete next[token]
                                          return next
                                        })
                                      }, 800)
                                    } catch {
                                      setRequestAction((prev) => ({
                                        ...prev,
                                        [token]: { status: 'idle', message: 'Failed to approve. Please try again.' }
                                      }))
                                      toast.error('Failed to approve request')
                                    }
                                  }}
                                  className={`theme-btn-success !py-1.5 !px-3 text-xs inline-flex items-center gap-1 ${
                                    requestAction[req.token] && requestAction[req.token].status === 'pending'
                                      ? 'opacity-60 cursor-not-allowed'
                                      : ''
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  disabled={requestAction[req.token] && requestAction[req.token].status === 'pending'}
                                  onClick={async () => {
                                    const token = req.token
                                    const title = req.capsuleTitle || 'this capsule'
                                    setRequestAction((prev) => ({
                                      ...prev,
                                      [token]: { status: 'pending', message: `Rejecting collaboration for ${title}...` }
                                    }))
                                    try {
                                      await api.respondCollaboration(token, 'reject')
                                      setRequestAction((prev) => ({
                                        ...prev,
                                        [token]: { status: 'rejected', message: `Rejected collaboration for ${title}.` }
                                      }))
                                      toast.success(`Rejected: ${title}`)
                                      pushRecentNotif({
                                        type: 'rejected',
                                        text: `You rejected collaboration for ${title}.`,
                                      })
                                      setTimeout(() => {
                                        setRequests((prev) => prev.filter((r) => (r && r.token) !== token))
                                        setRequestAction((prev) => {
                                          const next = { ...prev }
                                          delete next[token]
                                          return next
                                        })
                                      }, 800)
                                    } catch {
                                      setRequestAction((prev) => ({
                                        ...prev,
                                        [token]: { status: 'idle', message: 'Failed to reject. Please try again.' }
                                      }))
                                      toast.error('Failed to reject request')
                                    }
                                  }}
                                  className={`theme-btn-danger !py-1.5 !px-3 text-xs inline-flex items-center gap-1 ${
                                    requestAction[req.token] && requestAction[req.token].status === 'pending'
                                      ? 'opacity-60 cursor-not-allowed'
                                      : ''
                                  }`}
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </div>
                            </div>
                              ))}
                            </div>
                          )}

                          {recentNotif.length > 0 && (
                            <div className="pt-3 border-t theme-border">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold theme-text-muted tracking-wide uppercase">
                                  Recent
                                </p>
                                <button
                                  onClick={() => {
                                    setRecentNotif([])
                                    try { localStorage.removeItem('recentCollabNotifications') } catch {}
                                  }}
                                  className="text-[11px] theme-text-muted hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                              <div className="space-y-2">
                                {recentNotif.slice(0, 5).map((n) => (
                                  <div key={n.id} className="rounded-xl border theme-border px-3 py-2 bg-black/5 dark:bg-white/5">
                                    <p className="text-xs theme-text">{n.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="theme-btn-ghost rounded-xl p-2"
                title={`Current: ${getThemeLabel()}`}
              >
                {getThemeIcon()}
              </motion.button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden theme-btn-ghost rounded-xl p-2"
              >
                {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        </div>
      </motion.nav>

        {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 theme-bg-secondary border-b theme-border md:hidden"
          >
            <div className="theme-container py-4">
              <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                          : 'theme-nav-link hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Mode Selector (Desktop) */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 right-4 z-40 hidden lg:block"
          >
            <div className="theme-card p-3">
              <div className="space-y-2">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg transition-all duration-200 ${
                    theme === 'light'
                      ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                      : 'theme-nav-link hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Light</span>
                </button>
                
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg transition-all duration-200 ${
                    theme === 'dark'
                      ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                      : 'theme-nav-link hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-sm">Dark</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navigation 