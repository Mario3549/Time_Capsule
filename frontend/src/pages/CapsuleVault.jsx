import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Lock, 
  Unlock, 
  Trash2, 
  Eye,
  Calendar,
  Clock,
  Users,
  User,
  Plus,
  Heart,
  MessageCircle,
  Send,
  X
} from 'lucide-react'
import { Shield } from 'lucide-react'
import { useCapsules } from '../context/CapsuleContext'
import CountdownTimer from '../components/CountdownTimer'
import toast from 'react-hot-toast'
import api from '../services/api'

// Helper function to get user info from localStorage
const getUserInfo = () => {
  try {
    const userData = localStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

const CapsuleVault = () => {
  const { capsules, deleteCapsule, addToMemories, removeFromMemories, isInMemories } = useCapsules()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [showRemoveMemoryConfirm, setShowRemoveMemoryConfirm] = useState(null)
  
  // Comments and likes state
  const [comments, setComments] = useState({})
  const [likes, setLikes] = useState({})
  const [showCommentModal, setShowCommentModal] = useState(null)
  const [newComment, setNewComment] = useState('')

  const capsuleTypeColors = {
    Personal: 'theme-badge-primary',
    Career: 'theme-badge-success',
    Relationship: 'theme-badge-warning',
    Birthday: 'theme-badge-purple',
    Multi: 'theme-badge-primary'
  }

  const filteredCapsules = useMemo(() => {
    return capsules.filter(capsule => {
      const matchesSearch = capsule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           capsule.message.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterType === 'all' || capsule.type === filterType
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'locked' && !capsule.isUnlocked) ||
                           (filterStatus === 'unlocked' && capsule.isUnlocked)
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [capsules, searchTerm, filterType, filterStatus])

  const handleDelete = async (id) => {
    try {
      await deleteCapsule(id)
      toast.success('Capsule deleted successfully')
    } catch (e) {
      toast.error(e.message || 'Failed to delete capsule')
    } finally {
      setShowDeleteConfirm(null)
    }
  }

  const handleToggleMemories = async (capsule) => {
    try {
      if (isInMemories(capsule.id)) {
        setShowRemoveMemoryConfirm(capsule.id)
      } else {
        await addToMemories(capsule)
        toast.success('Added to memories')
      }
    } catch (e) {
      toast.error(e.message || 'Failed to update memories')
    }
  }

  const handleConfirmRemoveFromMemories = async (capsuleId) => {
    try {
      await removeFromMemories(capsuleId)
      toast.success('Removed from memories')
    } catch (e) {
      toast.error(e.message || 'Failed to update memories')
    } finally {
      setShowRemoveMemoryConfirm(null)
    }
  }

  // Load comments and likes for capsules
  React.useEffect(() => {
    let isCancelled = false

    const loadCapsuleData = async () => {
      try {
        const results = await Promise.all(
          filteredCapsules.map(async (capsule) => {
            try {
              const [commentsRes, likesRes] = await Promise.all([
                api.getComments(capsule.id),
                api.getLikes(capsule.id)
              ])
              return {
                id: capsule.id,
                comments: commentsRes.comments || [],
                likes: {
                  likes: likesRes.likes || [],
                  likeCount: likesRes.likeCount || 0
                }
              }
            } catch (error) {
              console.error('Error loading capsule data:', error)
              return {
                id: capsule.id,
                comments: [],
                likes: { likes: [], likeCount: 0 }
              }
            }
          })
        )

        if (isCancelled) return

        const commentsMap = {}
        const likesMap = {}
        for (const row of results) {
          commentsMap[row.id] = row.comments
          likesMap[row.id] = row.likes
        }

        // Single state updates avoid multiple render bursts.
        setComments(commentsMap)
        setLikes(likesMap)
      } catch (error) {
        console.error('Error loading capsule data:', error)
      }
    }
    
    if (filteredCapsules.length > 0) {
      loadCapsuleData()
    } else {
      setComments({})
      setLikes({})
    }

    return () => {
      isCancelled = true
    }
  }, [filteredCapsules])

  // Handle adding a comment
  const handleAddComment = async (capsuleId) => {
    if (!newComment.trim()) return
    
    const userInfo = getUserInfo()
    
    try {
      const response = await api.addComment(capsuleId, {
        userName: userInfo?.name || 'Anonymous',
        userEmail: userInfo?.email || '',
        content: newComment
      })
      
      setComments(prev => ({
        ...prev,
        [capsuleId]: [...(prev[capsuleId] || []), response.comment]
      }))
      
      setNewComment('')
      setShowCommentModal(null)
      toast.success('Comment added successfully')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
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

  const CapsuleCard = ({ capsule }) => {
    const isUnlocked = capsule.isUnlocked
    const isMulti = capsule.isMulti || capsule.type === 'Multi' || capsule.collaborators?.length > 0
    const isTimeReached = new Date() >= new Date(capsule.unlockDate)
    const inMemories = isInMemories(capsule.id)
    // Always allow delete action in UI; backend will enforce permissions
    const canDelete = true
    
    return (
      <motion.div
        variants={itemVariants}
        className="theme-card-hover overflow-hidden h-full"
      >
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold mb-1 truncate ${
                isUnlocked ? 'theme-text' : 'theme-text-accent'
              }`}>
                {capsule.title}
              </h3>
              <div className="flex items-center space-x-2 whitespace-nowrap overflow-hidden">
                <span className={`theme-badge ${capsuleTypeColors[capsule.type] || 'theme-badge-primary'}`}>
                  {capsule.type}
                </span>
                {isMulti && (
                  <span className="theme-badge theme-badge-purple inline-flex items-center" title="Multi-user capsule">
                    <Users className="h-3 w-3 mr-1" />
                    <span>Multi</span>
                  </span>
                )}
                {capsule.hasPassword && (
                  <span className="theme-badge theme-badge-warning inline-flex items-center" title="Password Protected">
                    <Shield className="h-3 w-3 mr-1" />
                    <span>Protected</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
          {isUnlocked ? (
                <Unlock className="h-5 w-5 theme-status-unlocked" />
          ) : (
                <Lock className="h-5 w-5 theme-status-locked" />
          )}
        </div>
        </div>

          {/* Date */}
          <div className="flex items-center space-x-2 mb-4 theme-text-muted text-sm">
            <Calendar className="h-4 w-4" />
            <span>
              {isUnlocked ? 'Unlocked' : 'Unlocks'} {new Date(capsule.unlockDate).toLocaleDateString()}
            </span>
          </div>

          {/* Timer or state callout to avoid awkward blank space */}
          <div className="mb-4 min-h-[64px] flex items-center">
            {!isTimeReached ? (
              <div className="w-full">
                <CountdownTimer unlockDate={capsule.unlockDate} />
              </div>
            ) : (!isUnlocked && capsule.hasPassword) ? (
              <div className="w-full">
                <div className="flex items-center justify-center rounded-xl border border-primary-400/40 bg-primary-500/10 dark:bg-primary-400/10 py-3 px-4 text-primary-700 dark:text-primary-300 text-sm font-medium">
                  <span className="mr-2">🔒</span>
                  Awaiting password to unlock
                </div>
              </div>
            ) : (
              <p className="theme-text-secondary text-sm line-clamp-2 w-full">
                {(capsule.message ? capsule.message.replace(/<[^>]*>/g, '') : 'No message')}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm theme-text-muted">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{likes[capsule.id]?.likeCount || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{comments[capsule.id]?.length || 0}</span>
              </div>
            </div>
            <div className="text-xs theme-text-muted">
              {isUnlocked ? 'Unlocked' : 'Locked'}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto flex items-center justify-between pt-4 theme-divider">
            <div className="flex items-center space-x-2">
              <Link
                to={`/capsule/${capsule.id}`}
                className="theme-btn-ghost p-2"
                title="View Capsule"
              >
                <Eye className="h-4 w-4" />
              </Link>
              
              <button
                onClick={() => handleToggleMemories(capsule)}
                className={`theme-btn-ghost p-2 transition-all duration-200 ${
                  inMemories
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'hover:text-red-500'
                }`}
                title={inMemories ? 'Remove from Memories' : 'Add to Memories'}
              >
                <Heart className={`h-4 w-4 ${inMemories ? 'fill-current' : ''}`} />
              </button>
              
              <button
                className="theme-btn-ghost p-2"
                title="Comment"
                onClick={() => setShowCommentModal(capsule.id)}
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              
              {canDelete ? (
                <button
                  onClick={() => setShowDeleteConfirm(capsule.id)}
                  className="theme-btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="Delete Capsule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="theme-btn-ghost p-2 opacity-40 cursor-not-allowed"
                  title="Only the owner can delete this capsule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const CapsuleListItem = ({ capsule }) => {
    const isUnlocked = capsule.isUnlocked
    const isMulti = capsule.isMulti || capsule.type === 'Multi' || capsule.collaborators?.length > 0
    const inMemories = isInMemories(capsule.id)
    // Always allow delete action in UI; backend will enforce permissions
    const canDelete = true

    return (
      <motion.div
        variants={itemVariants}
        className="theme-card p-4"
      >
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {isUnlocked ? (
                <Unlock className="h-6 w-6 theme-status-unlocked" />
              ) : (
                <Lock className="h-6 w-6 theme-status-locked" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold truncate ${
                isUnlocked ? 'theme-text' : 'theme-text-accent'
              }`}>
                {capsule.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1 whitespace-nowrap overflow-hidden">
                <span className={`theme-badge ${capsuleTypeColors[capsule.type] || 'theme-badge-primary'}`}>
                  {capsule.type}
                </span>
                {isMulti && (
                  <span className="theme-badge theme-badge-purple inline-flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    <span>Multi</span>
                  </span>
                )}
                {capsule.hasPassword && (
                  <span className="theme-badge theme-badge-warning inline-flex items-center" title="Password Protected">
                    <Shield className="h-3 w-3 mr-1" />
                    <span>Protected</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isUnlocked && (
              <div className="text-right">
                <CountdownTimer unlockDate={capsule.unlockDate} />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleToggleMemories(capsule)}
                className={`theme-btn-ghost p-2 transition-all duration-200 ${
                  inMemories
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'hover:text-red-500'
                }`}
                title={inMemories ? 'Remove from Memories' : 'Add to Memories'}
              >
                <Heart className={`h-4 w-4 ${inMemories ? 'fill-current' : ''}`} />
              </button>

              <Link
                to={`/capsule/${capsule.id}`}
                className="theme-btn-ghost p-2"
                title="View Capsule"
              >
                <Eye className="h-4 w-4" />
              </Link>
              
            {canDelete ? (
              <button
                  onClick={() => setShowDeleteConfirm(capsule.id)}
                  className="theme-btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="Delete Capsule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <button
                disabled
                className="theme-btn-ghost p-2 opacity-40 cursor-not-allowed"
                title="Only the owner can delete this capsule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen theme-bg pt-20">
      <div className="theme-container theme-section">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-header"
        >
          <h1 className="text-4xl font-bold theme-text mb-4">Capsule Vault</h1>
          <p className="text-gray-400 mb-6">
            Manage and organize your TimeVault capsules
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="theme-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
              <input
                type="text"
                placeholder="Search capsules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="theme-input pl-10 w-full"
              />
            </div>

            {/* Type Filter */}
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="theme-input"
              >
                <option value="all">All Types</option>
                <option value="Personal">Personal</option>
                <option value="Career">Career</option>
                <option value="Relationship">Relationship</option>
                <option value="Birthday">Birthday</option>
                <option value="Multi">Multi</option>
            </select>

            {/* Status Filter */}
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="theme-input"
              >
                <option value="all">All Status</option>
                <option value="locked">Locked</option>
                <option value="unlocked">Unlocked</option>
            </select>

            {/* View Mode */}
              <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' 
                      ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                      : 'theme-btn-ghost'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                      ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                      : 'theme-btn-ghost'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="theme-text-secondary">
            {filteredCapsules.length} capsule{filteredCapsules.length !== 1 ? 's' : ''} found
              </p>
              <Link to="/create" className="theme-btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create New</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Capsules Grid/List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
        {filteredCapsules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Lock className="h-24 w-24 theme-text-muted mx-auto mb-6" />
              <h3 className="text-2xl font-semibold theme-text mb-4">No capsules found</h3>
              <p className="theme-text-secondary mb-8 max-w-md mx-auto">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first Chronos capsule to get started'
                }
              </p>
              {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                <Link to="/create" className="theme-btn-primary">
                  Create Your First Capsule
            </Link>
              )}
          </motion.div>
        ) : (
            <div className={viewMode === 'grid' ? 'theme-grid' : 'space-y-4'}>
              <AnimatePresence>
                {filteredCapsules.map((capsule) => (
                  viewMode === 'grid' ? (
                    <CapsuleCard key={capsule.id} capsule={capsule} />
                  ) : (
                    <CapsuleListItem key={capsule.id} capsule={capsule} />
                  )
                ))}
              </AnimatePresence>
          </div>
        )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowDeleteConfirm(null)}
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
                Are you sure you want to delete this capsule? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-4">
              <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="theme-btn-secondary"
              >
                  Cancel
              </button>
              <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="theme-btn-danger"
              >
                  Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Remove from Memories Confirmation Modal */}
      <AnimatePresence>
        {showRemoveMemoryConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowRemoveMemoryConfirm(null)}
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
                  onClick={() => setShowRemoveMemoryConfirm(null)}
                  className="theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmRemoveFromMemories(showRemoveMemoryConfirm)}
                  className="theme-btn-danger"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="theme-card max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold theme-text">Add a Comment</h3>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="theme-btn-ghost p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text mb-2">
                    Comment *
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="theme-input w-full max-w-full min-h-[120px] resize-y"
                    placeholder="Write your comment..."
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowCommentModal(null)}
                    className="theme-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddComment(showCommentModal)}
                    disabled={!newComment.trim()}
                    className="theme-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CapsuleVault 