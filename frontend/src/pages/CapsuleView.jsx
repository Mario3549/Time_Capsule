import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Copy, 
  Heart, 
  MessageCircle,
  Send,
  Calendar, 
  Lock, 
  Unlock,
  Users,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Trash2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Clock,
  Globe,
  Shield,
  Plus,
  Share2
} from 'lucide-react'
import { useCapsules } from '../context/CapsuleContext'
import toast from 'react-hot-toast'
import api from '../services/api'

const CapsuleView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCapsuleById, deleteCapsule, addToMemories, isInMemories, removeFromMemories } = useCapsules()
  const [capsule, setCapsule] = useState(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [passwordError, setPasswordError] = useState('')
  const [showUnlockMessage, setShowUnlockMessage] = useState(false)
  const [unlockBannerShown, setUnlockBannerShown] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRemoveMemoryModal, setShowRemoveMemoryModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // Social interactions
  const [comments, setComments] = useState([])
  const [likeCount, setLikeCount] = useState(0)
  const [userHasLiked, setUserHasLiked] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null)
  const [showAllCollaborators, setShowAllCollaborators] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const foundCapsule = getCapsuleById(id)
    if (foundCapsule) {
      setCapsule(foundCapsule)
      setIsPasswordProtected(!!foundCapsule.hasPassword)
      
      const isTimeUnlocked = new Date() >= new Date(foundCapsule.unlockDate)
      const canUnlock = isTimeUnlocked && (!foundCapsule.hasPassword || foundCapsule.isUnlocked)
      setIsUnlocked(canUnlock)
      
      // Show password modal if time has expired and capsule is password protected
      if (isTimeUnlocked && foundCapsule.hasPassword && !foundCapsule.isUnlocked) {
        setShowPasswordModal(true)
      }
      
      // If timer has already expired and no password protection, set timeRemaining to null
      if (isTimeUnlocked) {
        setTimeRemaining(null)
      }
    } else {
      navigate('/vault')
    }
  }, [id, getCapsuleById, navigate])

  // Timer countdown effect
  useEffect(() => {
    if (!capsule) return

    let intervalId
    const updateTimer = () => {
      const now = new Date()
      const unlockDate = new Date(capsule.unlockDate)
      const diff = unlockDate - now

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setTimeRemaining({ days, hours, minutes, seconds })
      } else {
        setTimeRemaining(null)
        
        // Show password modal if capsule is password protected and not already unlocked
        if (capsule.hasPassword && !isUnlocked) {
          setShowPasswordModal(true)
        } else if (!capsule.hasPassword) {
          setIsUnlocked(true)
          if (!unlockBannerShown) {
            setShowUnlockMessage(true)
            setUnlockBannerShown(true)
            setTimeout(() => setShowUnlockMessage(false), 3000)
          }
        }
        if (intervalId) clearInterval(intervalId)
      }
    }

    updateTimer()
    intervalId = setInterval(updateTimer, 1000)

    return () => clearInterval(intervalId)
  }, [capsule, isUnlocked, unlockBannerShown])

  // Load comments/likes (comments should be visible even if not opened)
  useEffect(() => {
    const loadSocialData = async () => {
      if (!capsule) return
      try {
        const [commentsRes, likesRes] = await Promise.all([
          api.getComments(capsule.id),
          api.getLikes(capsule.id)
        ])
        setComments(commentsRes.comments || [])
        setLikeCount(likesRes.likeCount || 0)
        const userData = (() => { try { return JSON.parse(localStorage.getItem('userData') || 'null') } catch { return null } })()
        if (userData && Array.isArray(likesRes.likes)) {
          const liked = likesRes.likes.some(l => l.userId === userData.id || (l.userEmail && l.userEmail === userData.email))
          setUserHasLiked(liked)
        } else {
          setUserHasLiked(false)
        }
      } catch (e) {
        // ignore
      }
    }
    loadSocialData()
  }, [capsule, isUnlocked])

  const handleToggleLike = async () => {
    if (!capsule) return
    try {
      if (userHasLiked) {
        await api.removeLike(capsule.id)
        setUserHasLiked(false)
        setLikeCount(cnt => Math.max(0, cnt - 1))
      } else {
        const userData = (() => { try { return JSON.parse(localStorage.getItem('userData') || 'null') } catch { return null } })()
        await api.addLike(capsule.id, {
          userName: userData?.name || 'Anonymous',
          userEmail: userData?.email || ''
        })
        setUserHasLiked(true)
        setLikeCount(cnt => cnt + 1)
      }
    } catch (e) {
      // If already liked, try removing
      if (String(e.message || '').includes('Already liked')) {
        try {
          await api.removeLike(capsule.id)
          setUserHasLiked(false)
          setLikeCount(cnt => Math.max(0, cnt - 1))
        } catch {}
      }
    }
  }

  const handlePostComment = async () => {
    if (!newComment.trim() || !capsule) return
    try {
      const userData = (() => { try { return JSON.parse(localStorage.getItem('userData') || 'null') } catch { return null } })()
      const res = await api.addComment(capsule.id, {
        userName: userData?.name || 'Anonymous',
        userEmail: userData?.email || '',
        content: newComment.trim()
      })
      setComments(prev => [...prev, res.comment])
      setNewComment('')
      setShowCommentModal(false)
      toast.success('Comment added')
    } catch (e) {
      toast.error('Failed to add comment')
    }
  }
  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (e) {
      toast.error('Failed to delete comment')
    }
  }
  // Avatar color helper for conversation look
  const getAvatarColor = (seed) => {
    const colors = [
      'bg-gradient-to-br from-pink-500 to-rose-500',
      'bg-gradient-to-br from-blue-500 to-indigo-500',
      'bg-gradient-to-br from-green-500 to-emerald-500',
      'bg-gradient-to-br from-purple-500 to-fuchsia-500',
      'bg-gradient-to-br from-yellow-500 to-amber-500',
      'bg-gradient-to-br from-red-500 to-orange-500'
    ]
    const str = String(seed || '')
    const sum = str.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return colors[sum % colors.length]
  }
  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem('userData') || localStorage.getItem('user') || ''
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const formatPersonName = (email, fallback = '') => {
    if (fallback) return fallback
    return email || ''
  }

  const currentUser = getCurrentUser()
  const creatorEmail = capsule?.ownerEmail || ''
  const ownerNameFromCapsule = String(capsule?.ownerName || '').trim()
  const currentUserEmail = String(currentUser?.email || '').toLowerCase()
  const creatorEmailLower = String(creatorEmail || '').toLowerCase()
  const currentUserName = String(currentUser?.name || '').trim()
  const isOwner = !!(capsule && currentUser && capsule.ownerId && currentUser.id && String(capsule.ownerId) === String(currentUser.id))
  const creatorName = ownerNameFromCapsule
    || ((currentUserEmail && creatorEmailLower && currentUserEmail === creatorEmailLower && currentUserName) ? currentUserName : '')
    || formatPersonName(creatorEmail)

  const collaboratorList = Array.isArray(capsule?.collaborators)
    ? capsule.collaborators.map((c) => {
        if (typeof c === 'string') return { email: c, status: 'approved', name: '' }
        return {
          email: c?.email || '',
          status: c?.status || 'approved',
          name: c?.name || ''
        }
      })
        .filter((c) => !!c.email)
        // Avoid duplicate display when owner email is also present in collaborators.
        .filter((c) => String(c.email).toLowerCase() !== creatorEmailLower)
    : []
  const visibleCollaborators = showAllCollaborators ? collaboratorList : []
  const hiddenCollaboratorsCount = collaboratorList.length

  const handleExport = () => {
    if (!capsule) return
    
    const data = {
      title: capsule.title,
      message: capsule.message,
      type: capsule.type,
      unlockDate: capsule.unlockDate,
      createdAt: capsule.createdAt,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${capsule.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Capsule exported successfully')
  }

  const handleCopy = () => {
    if (!capsule) return
    
    // Remove HTML tags and get only text content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = capsule.message
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    
    const textToCopy = `${capsule.title}\n\n${textContent}`
    navigator.clipboard.writeText(textToCopy)
    toast.success('Message copied to clipboard')
  }

  const handleRecreate = () => {
    navigate('/create', { 
      state: { 
        recreateData: {
          title: capsule.title,
          message: capsule.message,
          type: capsule.type
        }
      }
    })
  }

  const handleAddToMemories = () => {
    if (!capsule) return
    
    if (isInMemories(capsule.id)) {
      setShowRemoveMemoryModal(true)
    } else {
      addToMemories(capsule)
      toast.success('Added to memories')
    }
  }

  const confirmRemoveFromMemories = async () => {
    if (!capsule) return
    try {
      await removeFromMemories(capsule.id)
      toast.success('Removed from memories')
    } catch (e) {
      toast.error(e.message || 'Failed to remove from memories')
    } finally {
      setShowRemoveMemoryModal(false)
    }
  }

  const handleDelete = () => {
    // Allow delete attempt; backend enforces permission
    setShowDeleteModal(true)
  }

  const handleRemoveCollaborator = async (email) => {
    if (!capsule || !email) return
    try {
      await api.removeCollaborator(capsule.id, email)
      setCapsule((prev) => ({
        ...prev,
        collaborators: (prev?.collaborators || []).filter((c) => {
          const collabEmail = typeof c === 'string' ? c : c?.email
          return String(collabEmail || '').toLowerCase() !== String(email).toLowerCase()
        }),
      }))
      toast.success('Collaborator removed')
    } catch (e) {
      toast.error(e.message || 'Failed to remove collaborator')
    }
  }

  const confirmDelete = async () => {
    if (!capsule) return
    try {
      await deleteCapsule(capsule.id)
      setShowDeleteModal(false)
      toast.success('Capsule deleted successfully')
      navigate('/vault')
    } catch (e) {
      toast.error(e.message || 'Failed to delete capsule')
    }
  }

  const nextMedia = () => {
    if (capsule?.media && capsule.media.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % capsule.media.length)
    }
  }

  const prevMedia = () => {
    if (capsule?.media && capsule.media.length > 0) {
      setCurrentMediaIndex((prev) => (prev - 1 + capsule.media.length) % capsule.media.length)
    }
  }

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isAudioPlaying) {
      audio.pause()
      setIsAudioPlaying(false)
    } else {
      audio.play()
      setIsAudioPlaying(true)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (!capsule || !capsule.hasPassword) return
    try {
      if (isUnlocking) return
      setIsUnlocking(true)
      await (await import('../services/api')).default.unlockCapsule(capsule.id, password)
      setIsUnlocked(true)
      setShowPasswordModal(false)
      setPassword('')
      setPasswordError('')
      if (!unlockBannerShown) {
        setShowUnlockMessage(true)
        setUnlockBannerShown(true)
        setTimeout(() => setShowUnlockMessage(false), 3000)
      }
      
      // Update capsule to mark as unlocked
      const updatedCapsule = { ...capsule, isUnlocked: true }
      setCapsule(updatedCapsule)
      
      toast.success('Capsule unlocked successfully!')
    } catch (err) {
      setPasswordError('Incorrect password. Please try again.')
      setPassword('')
    } finally {
      setIsUnlocking(false)
    }
  }

  const formatTimeRemaining = (time) => {
    if (!time) return null
    
    const parts = []
    if (time.days > 0) parts.push(`${time.days}d`)
    if (time.hours > 0) parts.push(`${time.hours}h`)
    if (time.minutes > 0) parts.push(`${time.minutes}m`)
    if (time.seconds > 0) parts.push(`${time.seconds}s`)
    
    return parts.join(' ')
  }

  if (!capsule) {
    return (
      <div className="min-h-screen theme-bg pt-20">
        <div className="theme-container theme-section">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="theme-text-secondary">Loading capsule...</p>
          </div>
        </div>
      </div>
    )
  }

  const isTimeUnlocked = new Date() >= new Date(capsule.unlockDate)
  const canUnlock = isTimeUnlocked && (!capsule.hasPassword || isUnlocked)

  return (
    <div className="min-h-screen theme-bg pt-20">
      <div className="theme-container theme-section">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-header"
        >
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => navigate(-1)}
              className="theme-btn-ghost flex items-center space-x-2"
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </motion.button>
            
            <div className="flex items-center space-x-4">
              {canUnlock && (
                <>
                  <button
                    onClick={handleCopy}
                    className="theme-btn-secondary flex items-center space-x-2"
                    title="Copy Content"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                  
                  <button
                    onClick={handleExport}
                    className="theme-btn-secondary flex items-center space-x-2"
                    title="Export Capsule"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                  
                  <button
                    onClick={handleRecreate}
                    className="theme-btn-secondary flex items-center space-x-2"
                    title="Recreate Similar"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Recreate</span>
                  </button>
                  
                    <button
                      onClick={handleAddToMemories}
                     className={`flex items-center space-x-2 ${
                       isInMemories(capsule.id) 
                         ? 'theme-btn-success' 
                         : 'theme-btn-primary'
                     }`}
                     title={isInMemories(capsule.id) ? 'Remove from Memories' : 'Add to Memories'}
                   >
                     <Heart className={`h-4 w-4 ${isInMemories(capsule.id) ? 'fill-current' : ''}`} />
                     <span>{isInMemories(capsule.id) ? 'Remove from Memories' : 'Add to Memories'}</span>
                    </button>
                </>
              )}
              
              
            </div>
          </div>
          
          <h1 className="text-4xl font-bold theme-text mb-4">{capsule.title}</h1>
          
          <div className="flex items-center space-x-4 mb-4 whitespace-nowrap overflow-hidden">
            <span className={`theme-badge ${
              capsule.type === 'Personal' ? 'theme-badge-primary' :
              capsule.type === 'Career' ? 'theme-badge-success' :
              capsule.type === 'Relationship' ? 'theme-badge-warning' :
              'theme-badge-purple'
            }`}>
              {capsule.type}
            </span>
            
            {capsule.isPublic && (
              <span className="theme-badge theme-badge-success inline-flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                <span>Public</span>
              </span>
            )}
            
            {capsule.hasPassword && (
              <span className="theme-badge theme-badge-warning inline-flex items-center" title="Password Protected">
                <Shield className="h-3 w-3 mr-1" />
                <span>Password Protected</span>
              </span>
            )}
          </div>

          {(capsule?.isMultiUser || collaboratorList.length > 0) && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold theme-text mb-2">People in this capsule</h3>
              <p className="theme-text-secondary text-sm mb-3">
                Created by <span className="font-semibold theme-text">{creatorName}</span>
                {creatorEmail ? ` (${creatorEmail})` : ''}.
                {collaboratorList.length > 0 ? ` Along with ${collaboratorList.length} collaborator${collaboratorList.length > 1 ? 's' : ''}.` : ''}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border theme-border px-3 py-2">
                  <div>
                    <div
                      className="text-sm font-semibold theme-text"
                      title={creatorEmail || ''}
                    >
                      {isOwner ? `${creatorName} (You)` : creatorName}
                    </div>
                    {!ownerNameFromCapsule && creatorEmail && (
                      <div className="text-xs theme-text-muted">{creatorEmail}</div>
                    )}
                  </div>
                  <span className="theme-badge theme-badge-primary">Creator</span>
                </div>
                {visibleCollaborators.map((collab) => (
                  (() => {
                    const collabEmailLower = String(collab.email || '').toLowerCase()
                    const isCurrentUserCollaborator = !!(currentUserEmail && collabEmailLower && currentUserEmail === collabEmailLower)
                    const canRemoveCollaborator = isOwner || isCurrentUserCollaborator
                    return (
                  <div
                    key={`${collab.email}-${collab.status}`}
                    className="flex items-center justify-between rounded-xl border theme-border px-3 py-2"
                    title={`Status: ${collab.status}`}
                  >
                    <div>
                      <div
                        className="text-sm font-semibold theme-text"
                        title={collab.email || ''}
                      >
                        {collab.name || collab.email}{isCurrentUserCollaborator ? ' (You)' : ''}
                      </div>
                      {!collab.name && (
                        <div className="text-xs theme-text-muted">{collab.email}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`theme-badge ${
                          collab.status === 'approved'
                            ? 'theme-badge-success'
                            : collab.status === 'rejected'
                              ? 'theme-badge-danger'
                              : 'theme-badge-warning'
                        }`}
                      >
                        {collab.status}
                      </span>
                      {canRemoveCollaborator && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab.email)}
                          className="theme-btn-ghost p-1 text-red-500 hover:text-red-600"
                          title={isOwner ? 'Remove collaborator' : 'Leave collaboration'}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                    )
                  })()
                ))}
                {!showAllCollaborators && hiddenCollaboratorsCount > 0 && (
                  <button
                    onClick={() => setShowAllCollaborators(true)}
                    className="theme-btn-ghost text-sm"
                  >
                    Show collaborators ({hiddenCollaboratorsCount})
                  </button>
                )}
                {showAllCollaborators && collaboratorList.length > 0 && (
                  <button
                    onClick={() => setShowAllCollaborators(false)}
                    className="theme-btn-ghost text-sm"
                  >
                    Hide collaborators
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Timer Section */}
        {!canUnlock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="theme-card p-8 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold theme-text">Capsule Locked</h2>
              </div>
              
              <p className="theme-text-secondary mb-6">
                This capsule will unlock on {new Date(capsule.unlockDate).toLocaleDateString()}
              </p>
              
              {timeRemaining && (
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold mb-2">Time Remaining</h3>
                  <div className="text-3xl font-bold">
                    {formatTimeRemaining(timeRemaining)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Comments visible even when locked */}
        {!canUnlock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <div className="theme-card p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold theme-text">Comments</h2>
                <button
                  onClick={() => setShowCommentModal(true)}
                  className="theme-btn-secondary"
                  title="Add Comment"
                >
                  Add Comment
                </button>
              </div>
              {comments.length === 0 ? (
                <p className="theme-text-secondary">No comments yet. Be the first to comment.</p>
              ) : (
                <div className="space-y-4">
                  {(() => { const userData = getCurrentUser(); return comments.map(c => {
                    const isMine = (userData && c.userId && userData.id && c.userId === userData.id) || (userData && c.userEmail && userData.email && c.userEmail === userData.email)
                    return (
                      <div key={c.id} className={`flex items-start ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className={`mr-3 flex-shrink-0 w-10 h-10 rounded-full text-white font-semibold flex items-center justify-center ${getAvatarColor(c.userEmail || c.userName)}`}>
                            {(c.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`max-w-[85%] ${isMine ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center ${isMine ? 'justify-end' : 'justify-start'} space-x-2 mb-1`}>
                            {!isMine && <span className="text-sm font-semibold theme-text">{c.userName || 'Anonymous'}</span>}
                            <span className="text-xs theme-text-muted">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <div className={`inline-flex items-start rounded-2xl px-4 py-3 shadow-sm border ${isMine ? 'bg-primary-500/10 border-primary-500/30' : 'bg-white/70 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60'}`}>
                            <div className="text-sm theme-text-secondary leading-relaxed">{c.content}</div>
                            {isMine && (
                              <button
                                onClick={() => setConfirmDeleteCommentId(c.id)}
                                className="ml-2 p-1 rounded-md theme-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                aria-label="Delete comment"
                                title="Delete comment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {isMine && (
                          <div className={`ml-3 flex-shrink-0 w-10 h-10 rounded-full text-white font-semibold flex items-center justify-center ${getAvatarColor(c.userEmail || c.userName)}`}>
                            {(c.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}) })()}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {canUnlock && (
          <div className="mb-6">
            <span className="theme-badge theme-badge-success">Unlocked on {new Date(capsule.unlockDate).toLocaleDateString()}</span>
          </div>
        )}

        {/* Unlocked Content */}
        {canUnlock && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Message */}
            <div className="theme-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold theme-text">Your Message</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="theme-btn-ghost p-2"
                    title="Copy Message"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleExport}
                    className="theme-btn-ghost p-2"
                    title="Export Capsule"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {capsule.message ? (
                <div 
                  className="theme-text-secondary text-lg leading-relaxed prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: capsule.message }}
                />
              ) : (
                <p className="theme-text-secondary">No message provided.</p>
              )}

            </div>

            {/* Media Gallery */}
            {capsule.media && capsule.media.length > 0 && (
              <div className="theme-card p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold theme-text">Media</h2>
                  <div className="flex items-center space-x-2 text-sm theme-text-muted">
                    <span>File {currentMediaIndex + 1} of {capsule.media.length}</span>
                    {capsule.media[currentMediaIndex]?.name && (
                      <span>• {capsule.media[currentMediaIndex].name}</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-gray-100 dark:bg-white/10 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {capsule.media[currentMediaIndex]?.type?.startsWith('image') ? (
                      <div className="flex justify-center items-center p-4">
                      <img 
                        src={capsule.media[currentMediaIndex].url} 
                          alt={capsule.media[currentMediaIndex]?.name || "Media"} 
                          className="max-w-full max-h-[500px] w-auto h-auto object-contain rounded-lg shadow-lg"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                          onLoad={(e) => {
                            // Ensure image is visible after loading
                            e.target.style.opacity = '1';
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', capsule.media[currentMediaIndex]?.url);
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.media-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        
                        {/* Fallback for failed images */}
                        <div className="media-fallback hidden flex justify-center items-center min-h-[400px]">
                          <div className="text-center">
                            <AlertTriangle className="h-16 w-16 theme-text-muted mx-auto mb-4" />
                            <p className="theme-text-secondary">Image not available</p>
                            <p className="theme-text-muted text-sm">The image may have been moved or deleted</p>
                          </div>
                        </div>
                      </div>
                    ) : capsule.media[currentMediaIndex]?.type?.startsWith('video') ? (
                      <div className="flex justify-center items-center p-4">
                      <video 
                        src={capsule.media[currentMediaIndex].url} 
                        controls 
                          className="max-w-full max-h-[500px] w-auto h-auto object-contain rounded-lg shadow-lg"
                          onError={(e) => {
                            console.error('Video failed to load:', capsule.media[currentMediaIndex]?.url);
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.media-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        
                        {/* Fallback for failed videos */}
                        <div className="media-fallback hidden flex justify-center items-center min-h-[400px]">
                          <div className="text-center">
                            <AlertTriangle className="h-16 w-16 theme-text-muted mx-auto mb-4" />
                            <p className="theme-text-secondary">Video not available</p>
                            <p className="theme-text-muted text-sm">The video may have been moved or deleted</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center p-6 min-h-[200px]">
                        <div className="w-full max-w-xl text-center">
                          <Volume2 className="h-12 w-12 theme-text-muted mx-auto mb-3" />
                          <p className="theme-text-secondary mb-3">Audio file</p>
                          <audio
                            ref={audioRef}
                            src={capsule.media[currentMediaIndex]?.url}
                            controls
                            className="w-full"
                            onPlay={() => setIsAudioPlaying(true)}
                            onPause={() => setIsAudioPlaying(false)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {capsule.media.length > 1 && (
                    <>
                      <button
                        onClick={prevMedia}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 theme-btn-ghost p-2 bg-white/80 dark:bg-black/80 rounded-full"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextMedia}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 theme-btn-ghost p-2 bg-white/80 dark:bg-black/80 rounded-full"
                      >
                        <ArrowLeft className="h-5 w-5 rotate-180" />
                      </button>
                      
                      <div className="flex justify-center mt-4 space-x-2">
                        {capsule.media.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentMediaIndex(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              index === currentMediaIndex 
                                ? 'bg-primary-500' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  

                </div>
              </div>
            )}

            {/* Likes / Comments */}
            <div className="theme-card p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleToggleLike}
                    className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      userHasLiked ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${userHasLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{userHasLiked ? 'Liked' : 'Like'}</span>
                    <span className="text-xs opacity-70">{likeCount}</span>
                  </button>
                  <button
                    onClick={() => setShowCommentModal(true)}
                    className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Comment</span>
                    <span className="text-xs opacity-70">{comments.length}</span>
                  </button>
                </div>
              </div>

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="mt-4 space-y-4">
                  {(() => { const userData = getCurrentUser(); return comments.map(c => {
                    const isMine = (userData && c.userId && userData.id && c.userId === userData.id) || (userData && c.userEmail && userData.email && c.userEmail === userData.email)
                    return (
                      <div key={c.id} className={`flex items-start ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <div className={`mr-3 flex-shrink-0 w-10 h-10 rounded-full text-white font-semibold flex items-center justify-center ${getAvatarColor(c.userEmail || c.userName)}`}>
                            {(c.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`max-w-[85%] ${isMine ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center ${isMine ? 'justify-end' : 'justify-start'} space-x-2 mb-1`}>
                            {!isMine && <span className="text-sm font-semibold theme-text">{c.userName || 'Anonymous'}</span>}
                            <span className="text-xs theme-text-muted">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <div className={`relative inline-flex items-start rounded-2xl px-4 py-3 shadow-sm border group ${isMine ? 'bg-primary-500/10 border-primary-500/30' : 'bg-white/70 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/60'}`}>
                            <div className="text-sm theme-text-secondary leading-relaxed">{c.content}</div>
                            {isMine && (
                              <button
                                onClick={() => setConfirmDeleteCommentId(c.id)}
                                className="hidden group-hover:flex p-1 rounded-md theme-text-muted hover:text-red-500 hover:bg-red-500/10 absolute -top-2 -right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                aria-label="Delete comment"
                                title="Delete comment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {isMine && (
                          <div className={`ml-3 flex-shrink-0 w-10 h-10 rounded-full text-white font-semibold flex items-center justify-center ${getAvatarColor(c.userEmail || c.userName)}`}>
                            {(c.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}) })()}
                </div>
              )}
            </div>

             {/* Delete Button */}
             <div className="flex items-center justify-end">
                <button
                 onClick={handleDelete}
                 className="flex items-center space-x-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors"
                >
                 <Trash2 className="h-5 w-5" />
                 <span>Delete Capsule</span>
                </button>
             </div>
             
          </motion.div>
        )}
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowCommentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="theme-modal-content p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold theme-text mb-4">Add a Comment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text mb-2">Comment *</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="theme-input w-full max-w-full min-h-[120px] resize-y"
                    placeholder="Write your comment..."
                    required
                  />
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button onClick={() => setShowCommentModal(false)} className="theme-btn-secondary">Cancel</button>
                  <button onClick={handlePostComment} disabled={!newComment.trim()} className="theme-btn-primary inline-flex items-center gap-2 disabled:opacity-50">
                    <Send className="h-4 w-4" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

  {/* Delete Comment Confirm */}
  <AnimatePresence>
    {confirmDeleteCommentId && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="theme-modal"
        onClick={() => setConfirmDeleteCommentId(null)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="theme-modal-content p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold theme-text mb-2">Delete comment?</h3>
          <p className="theme-text-secondary mb-4">This action cannot be undone.</p>
          <div className="flex items-center justify-end space-x-3">
            <button onClick={() => setConfirmDeleteCommentId(null)} className="theme-btn-secondary">Cancel</button>
            <button onClick={() => { handleDeleteComment(confirmDeleteCommentId); setConfirmDeleteCommentId(null); }} className="theme-btn-danger">Delete</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="theme-modal-content p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold theme-text mb-2">Password Required</h3>
                <p className="theme-text-secondary">
                  This capsule is password protected. Please enter the password to unlock it.
                </p>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="theme-form-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="theme-input pr-10 w-full"
                      placeholder="Enter password..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 theme-text-muted hover:theme-text"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordModal(false); navigate('/vault'); }}
                    className="theme-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUnlocking}
                    className="theme-btn-primary disabled:opacity-60"
                  >
                    {isUnlocking ? 'Unlocking...' : 'Unlock Capsule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="theme-modal-content p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold theme-text mb-4">Delete Capsule</h3>
              <p className="theme-text-secondary mb-6">
                Are you sure you want to delete "{capsule.title}"? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="theme-btn-danger"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock Success Message */}
      <AnimatePresence>
        {showUnlockMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center space-x-3">
              <Unlock className="h-5 w-5" />
              <span className="font-semibold">Capsule unlocked successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove from Memories Confirmation Modal */}
      <AnimatePresence>
        {showRemoveMemoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowRemoveMemoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="theme-modal-content p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold theme-text mb-4">Remove from Memories</h3>
              <p className="theme-text-secondary mb-6">
                Are you sure you want to remove this capsule from memories?
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowRemoveMemoryModal(false)}
                  className="theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveFromMemories}
                  className="theme-btn-danger"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CapsuleView 