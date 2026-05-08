import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  User,
  LogIn,
  Key,
  RefreshCw
} from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import ThreeDAnimation from '../components/ThreeDAnimation'
import Logo from '../components/Logo'
import apiService from '../services/api'

const Login = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [isResendingOTP, setIsResendingOTP] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleResendOTP = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Please enter your email and password first')
      return
    }

    setIsResendingOTP(true)
    try {
      // Call login endpoint again to generate new OTP
      const response = await apiService.login({
        email: formData.email,
        password: formData.password
      })
      
      if (response.needsOTP) {
        toast.success('New OTP sent to your email!')
      } else {
        toast.error(response.message || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP')
    } finally {
      setIsResendingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    try {
      // Use the login endpoint with OTP
      const response = await apiService.login({
        email: formData.email,
        password: formData.password,
        otp: formData.otp
      })
      
      if (response.success) {
        // Store auth token in localStorage
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        toast.success('Login successful!')
        navigate('/dashboard')
      } else {
        toast.error(response.message || 'OTP verification failed')
      }
    } catch (error) {
      toast.error(error.message || 'OTP verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    // If OTP is shown, handle OTP verification
    if (showOTP) {
      await handleVerifyOTP()
      return
    }

    setIsLoading(true)

    try {
      const response = await apiService.login({
        email: formData.email,
        password: formData.password
      })

      if (response.success) {
        // Store auth token in localStorage
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        toast.success('Welcome back!')
        navigate('/dashboard')
      } else {
        // Check if verification is needed
        if (response.needsVerification) {
          toast.error('Please verify your email before logging in')
          setShowOTP(true)
          // Send OTP for verification
          try {
            await apiService.resendOTP(formData.email, formData.email.split('@')[0])
            toast.success('OTP sent to your email for verification')
          } catch (otpError) {
            toast.error('Failed to send OTP. Please try again.')
          }
        } else if (response.needsOTP) {
          // OTP required for login
          toast.success('OTP sent to your email')
          setShowOTP(true)
        } else {
          toast.error(response.message || 'Login failed')
        }
      }
    } catch (error) {
      // Handle network errors or other exceptions
      if (error.message.includes('verify your email') || error.message.includes('needsVerification')) {
        toast.error('Please verify your email before logging in')
        setShowOTP(true)
        // Send OTP for verification
        try {
          await apiService.resendOTP(formData.email, formData.email.split('@')[0])
          toast.success('OTP sent to your email for verification')
        } catch (otpError) {
          toast.error('Failed to send OTP. Please try again.')
        }
      } else {
        toast.error(error.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className="min-h-screen theme-bg relative overflow-hidden pt-20">
      {/* Animated Background */}
      <AnimatedBackground />
      <ThreeDAnimation />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold theme-text mb-4"
            >
              Welcome Back
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="theme-text-secondary text-lg"
            >
              Sign in to your TimeVault account
            </motion.p>
          </motion.div>

          {/* Login Form */}
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="theme-card p-8 space-y-6 rounded-2xl"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label className="theme-text font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="theme-input w-full pl-12 text-lg rounded-2xl"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="theme-text font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className="theme-input w-full pl-12 pr-12 text-lg rounded-2xl"
                  required
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

            {/* OTP Field - Show when OTP verification is needed */}
            {showOTP && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="theme-text font-medium">Verification Code</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="theme-input w-full pl-12 pr-12 text-lg rounded-2xl text-center tracking-widest"
                    maxLength={6}
                  />
                </div>
                <p className="theme-text-secondary text-sm text-center">
                  We've sent a verification code to your email
                </p>
              </motion.div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-500 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-400 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="theme-text-secondary text-sm">Remember me</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="theme-text-accent hover:underline text-sm"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3 text-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>{showOTP ? 'Verifying...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-6 w-6" />
                  <span>{showOTP ? 'Verify & Sign In' : 'Sign In'}</span>
                </>
              )}
            </motion.button>

            {/* OTP Actions */}
            {showOTP && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center space-x-4"
              >
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isResendingOTP}
                  className="theme-text-accent hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {isResendingOTP ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Resend OTP</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="theme-text-secondary hover:underline text-sm"
                >
                  Back to Login
                </button>
              </motion.div>
            )}

            {/* Divider (social logins removed in v4) */}
            <div className="relative hidden">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 theme-text-muted">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons (disabled in v4) */}
            <div className="grid grid-cols-2 gap-4 hidden">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="theme-btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </motion.button>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="theme-btn-secondary flex items-center justify-center space-x-2 py-3"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
                <span>Twitter</span>
              </motion.button>
            </div>
          </motion.form>

          {/* Sign Up Link */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="theme-text-secondary">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="theme-text-accent hover:underline font-medium"
              >
                Sign up for free
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
