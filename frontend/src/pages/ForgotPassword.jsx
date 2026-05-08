import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, Sparkles, ArrowLeft, Send } from 'lucide-react'
import AnimatedBackground from '../components/AnimatedBackground'
import ThreeDAnimation from '../components/ThreeDAnimation'
import apiService from '../services/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await apiService.forgotPassword(email.trim())
      if (response.success) {
        setSubmitted(true)
        toast.success(response.message || 'Check your email for reset instructions')
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.')
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
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold theme-text mb-4">Forgot password</h1>
            <p className="theme-text-secondary text-lg">
              Enter your email and we&apos;ll send a link to reset your password.
            </p>
          </motion.div>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="theme-card p-8 space-y-6 rounded-2xl"
          >
            {submitted ? (
              <p className="theme-text-secondary text-center">
                If an account exists for that email, you will receive a password reset link shortly.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="theme-text font-medium">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="theme-input w-full pl-12 text-lg rounded-2xl"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {!submitted && (
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    <span>Send reset link</span>
                  </>
                )}
              </motion.button>
            )}

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

export default ForgotPassword
