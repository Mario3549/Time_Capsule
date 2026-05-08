import React, { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, Sparkles, ArrowLeft, KeyRound } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import ThreeDAnimation from '../components/ThreeDAnimation'
import apiService from '../services/api'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      toast.error('Invalid or missing reset link. Request a new password reset from the login page.')
      return
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await apiService.resetPassword(token, password)
      if (response.success) {
        toast.success(response.message || 'Password updated. You can sign in now.')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error.message || 'Could not reset password. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  return (
    <div className="min-h-screen theme-bg relative overflow-hidden pt-20">
      <AnimatedBackground />
      <ThreeDAnimation />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full space-y-8"
        >
          <motion.div variants={itemVariants} className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-4">
              <KeyRound className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold theme-text mb-4">Set new password</h1>
            <p className="theme-text-secondary text-lg">
              Choose a strong password for your TimeVault account.
            </p>
          </motion.div>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="theme-card p-8 space-y-6 rounded-2xl"
          >
            {!token && (
              <p className="text-amber-600 dark:text-amber-400 text-sm text-center">
                This page needs a valid token from your email link.{' '}
                <Link to="/forgot-password" className="underline font-medium">
                  Request a new reset
                </Link>
                .
              </p>
            )}

            <div className="space-y-2">
              <label className="theme-text font-medium">New password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="theme-input w-full pl-12 pr-12 text-lg rounded-2xl"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 theme-text-muted hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="theme-text font-medium">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="theme-input w-full pl-12 pr-12 text-lg rounded-2xl"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 theme-text-muted hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !token}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6" />
                  <span>Update password</span>
                </>
              )}
            </motion.button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 theme-text-accent hover:underline text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  )
}

export default ResetPassword
