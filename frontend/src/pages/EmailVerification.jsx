import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Mail, ArrowRight, RefreshCw, Key } from 'lucide-react'
import apiService from '../services/api'
import toast from 'react-hot-toast'
import AnimatedBackground from '../components/AnimatedBackground'
import ThreeDAnimation from '../components/ThreeDAnimation'

const EmailVerification = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [verificationStatus, setVerificationStatus] = useState('waiting') // waiting, verifying, success, error
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    console.log('EmailVerification component loaded')
    console.log('Token:', token)
    console.log('Location state:', location.state)
    
    // Get data from navigation state
    if (location.state?.email) {
      setEmail(location.state.email)
      setName(location.state.name || '')
      setPassword(location.state.password || '')
      console.log('Data set from state:', location.state)
    }

    if (token) {
      console.log('Token found, verifying email...')
      setVerificationStatus('verifying')
      verifyEmail(token)
    } else {
      console.log('No token, showing OTP verification state...')
      // User came from signup, show OTP verification state
      setVerificationStatus('waiting')
    }
  }, [token, location.state])

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setVerificationStatus('verifying')
    try {
      const response = await apiService.verifyOTP(email, otp, name, password)
      
      if (response.success) {
        setVerificationStatus('success')
        toast.success('Account created successfully! You can now login.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setVerificationStatus('waiting')
        toast.error(response.message || 'OTP verification failed')
      }
    } catch (error) {
      setVerificationStatus('waiting')
      toast.error(error.message || 'OTP verification failed')
    }
  }

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await apiService.verifyEmail(verificationToken)
      
      if (response.success) {
        setVerificationStatus('success')
        setEmail(response.user.email)
        toast.success('Email verified successfully!')
      } else {
        setVerificationStatus('error')
        toast.error(response.message || 'Verification failed')
      }
    } catch (error) {
      setVerificationStatus('error')
      toast.error(error.message || 'Verification failed')
    }
  }

  const handleResendOTP = async () => {
    if (!email || !name) {
      toast.error('Email and name are required')
      return
    }

    setIsResending(true)
    try {
      const response = await apiService.resendOTP(email, name)
      if (response.success) {
        toast.success('New OTP sent to your email!')
      } else {
        toast.error(response.message || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP')
    } finally {
      setIsResending(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsResending(true)
    try {
      const response = await apiService.resendVerification(email)
      
      if (response.success) {
        toast.success('Verification email sent! Please check your inbox.')
      } else {
        toast.error(response.message || 'Failed to resend verification email')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification email')
    } finally {
      setIsResending(false)
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

  const renderContent = () => {
    switch (verificationStatus) {
      case 'waiting':
        return (
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Key className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold theme-text mb-4">Verify Your Email</h1>
            <p className="theme-text-secondary text-lg mb-6">
              We've sent a 6-digit OTP code to your email address. Please enter it below to complete your registration.
            </p>
            <div className="space-y-4">
              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-300 shadow-sm text-center text-2xl tracking-widest"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={verifyOTP}
                disabled={verificationStatus === 'verifying'}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verificationStatus === 'verifying' ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Verify OTP</span>
                  </>
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResendOTP}
                disabled={isResending}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    <span>Resend OTP</span>
                  </>
                )}
              </motion.button>
              
              <button
                onClick={() => navigate('/signup')}
                className="block mx-auto theme-text-accent hover:underline text-sm"
              >
                Back to Signup
              </button>
            </div>
          </motion.div>
        )

      case 'verifying':
        return (
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-3xl font-bold theme-text mb-4">Verifying Your Email</h1>
            <p className="theme-text-secondary text-lg">
              Please wait while we verify your email address...
            </p>
          </motion.div>
        )

      case 'success':
        return (
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold theme-text mb-4">Email Verified!</h1>
            <p className="theme-text-secondary text-lg mb-6">
              Your email address has been successfully verified. You can now access all features of TimeVault.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 mx-auto"
            >
              <span>Continue to Login</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        )

      case 'error':
        return (
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold theme-text mb-4">Verification Failed</h1>
            <p className="theme-text-secondary text-lg mb-6">
              The verification link is invalid or has expired. Please request a new verification email.
            </p>
            
            <div className="space-y-4">
              <div className="max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-300 shadow-sm"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResendVerification}
                disabled={isResending}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </motion.button>
              
              <button
                onClick={() => navigate('/signup')}
                className="block mx-auto theme-text-accent hover:underline text-sm"
              >
                Back to Signup
              </button>
            </div>
          </motion.div>
        )

      default:
        return null
    }
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
          className="max-w-md w-full"
        >
          <motion.div
            variants={itemVariants}
            className="theme-card p-8 rounded-2xl"
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default EmailVerification


