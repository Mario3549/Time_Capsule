import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import apiService from '../services/api'
import Logo from '../components/Logo'

const CollaborationRespond = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')
  const [action, setAction] = useState(null) // approve | reject

  useEffect(() => {
    const token = searchParams.get('token')
    const actionParam = searchParams.get('action')

    if (!token || !actionParam) {
      setStatus('error')
      setMessage('Invalid link. Missing token or action.')
      return
    }

    if (actionParam !== 'approve' && actionParam !== 'reject') {
      setStatus('error')
      setMessage('Invalid action. Use the links from your email.')
      return
    }

    const respond = async () => {
      try {
        const res = await apiService.respondCollaboration(token, actionParam)
        setAction(actionParam)
        setStatus('success')
        setMessage(res.message || (actionParam === 'approve' ? 'Collaboration approved!' : 'Collaboration declined.'))
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Something went wrong. The link may have expired.')
      }
    }

    respond()
  }, [searchParams])

  return (
    <div className="min-h-screen theme-bg flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <Link to="/">
            <Logo size="default" />
          </Link>
        </div>

        <div className="theme-card p-8 rounded-2xl text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 theme-text-muted mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold theme-text mb-2">Processing...</h2>
              <p className="theme-text-secondary">Please wait while we process your response.</p>
            </>
          )}

          {status === 'success' && (
            <>
              {action === 'approve' ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              )}
              <h2 className="text-xl font-semibold theme-text mb-2">
                {action === 'approve' ? 'Collaboration Approved' : 'Collaboration Declined'}
              </h2>
              <p className="theme-text-secondary mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/login"
                  className="theme-btn-primary inline-flex items-center justify-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/"
                  className="theme-btn-secondary inline-flex items-center justify-center"
                >
                  Go to Home
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold theme-text mb-2">Unable to Process</h2>
              <p className="theme-text-secondary mb-6">{message}</p>
              <p className="theme-text-muted text-sm mb-6">
                You can ask the capsule owner to send you a new invitation.
              </p>
              <Link to="/" className="theme-btn-secondary inline-flex items-center justify-center">
                Go to Home
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default CollaborationRespond

