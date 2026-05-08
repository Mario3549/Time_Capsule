import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Calendar,
  Clock,
  Users,
  Filter,
  Grid,
  List,
  Globe,
  ArrowRight,
  Plus,
  Send,
  X
} from 'lucide-react'
import { useCapsules } from '../context/CapsuleContext'
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

const PublicCapsules = () => {
  const { publicCapsules } = useCapsules()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [filteredCapsules, setFilteredCapsules] = useState([])
  
  // Comments and likes state
  const [comments, setComments] = useState({})
  const [likes, setLikes] = useState({})
  const [showCommentModal, setShowCommentModal] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [userLikes, setUserLikes] = useState(new Set())

  useEffect(() => {
    let filtered = publicCapsules.filter(capsule => 
      capsule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (capsule.message && capsule.message.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (selectedType !== 'all') {
      filtered = filtered.filter(capsule => capsule.type === selectedType)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'popular':
          return (b.likes || 0) + (b.comments || 0) - (a.likes || 0) - (a.comments || 0)
        default:
          return 0
      }
    })

    setFilteredCapsules(filtered)
  }, [publicCapsules, searchTerm, selectedType, sortBy])

  // Load comments and likes for each capsule
  useEffect(() => {
    const loadCapsuleData = async () => {
      const userInfo = getUserInfo()
      const userLikesSet = new Set()
      
      for (const capsule of filteredCapsules) {
        try {
          const [commentsRes, likesRes] = await Promise.all([
            api.getComments(capsule.id),
            api.getLikes(capsule.id)
          ])
          
          setComments(prev => ({
            ...prev,
            [capsule.id]: commentsRes.comments || []
          }))
          
          setLikes(prev => ({
            ...prev,
            [capsule.id]: {
              likes: likesRes.likes || [],
              likeCount: likesRes.likeCount || 0
            }
          }))
          
          // Check if current user has liked this capsule
          if (userInfo && likesRes.likes) {
            const hasLiked = likesRes.likes.some(like => 
              like.userId === userInfo.id || 
              (like.userName === userInfo.name && like.userEmail === userInfo.email)
            )
            if (hasLiked) {
              userLikesSet.add(capsule.id)
            }
          }
        } catch (error) {
          console.error('Error loading capsule data:', error)
        }
      }
      
      setUserLikes(userLikesSet)
    }
    
    if (filteredCapsules.length > 0) {
      loadCapsuleData()
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
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // Handle adding a like (public list)
  const handleAddLike = async (capsuleId) => {
    const userInfo = getUserInfo()
    
    try {
      const response = await api.addLike(capsuleId, {
        userName: userInfo?.name || 'Anonymous',
        userEmail: userInfo?.email || ''
      })
      
      setLikes(prev => ({
        ...prev,
        [capsuleId]: {
          ...prev[capsuleId],
          likes: [...(prev[capsuleId]?.likes || []), response.like],
          likeCount: (prev[capsuleId]?.likeCount || 0) + 1
        }
      }))
      
      setUserLikes(prev => new Set([...prev, capsuleId]))
    } catch (error) {
      // If server says already liked, just mark it as liked and sync counts
      if (String(error.message || '').includes('Already liked')) {
        setUserLikes(prev => new Set([...prev, capsuleId]))
        try {
          const likesRes = await api.getLikes(capsuleId)
          setLikes(prev => ({
            ...prev,
            [capsuleId]: {
              likes: likesRes.likes || [],
              likeCount: likesRes.likeCount || 0
            }
          }))
        } catch {}
      } else {
        console.error('Error adding like:', error)
      }
    }
  }

  // Handle removing a like (public list)
  const handleRemoveLike = async (capsuleId) => {
    try {
      await api.removeLike(capsuleId)
      
      setLikes(prev => ({
        ...prev,
        [capsuleId]: {
          ...prev[capsuleId],
          likeCount: Math.max(0, (prev[capsuleId]?.likeCount || 1) - 1)
        }
      }))
      
      setUserLikes(prev => {
        const newSet = new Set(prev)
        newSet.delete(capsuleId)
        return newSet
      })
    } catch (error) {
      // If like not found, assume it was already removed and sync state
      if (String(error.message || '').includes('Like not found')) {
        setUserLikes(prev => {
          const newSet = new Set(prev)
          newSet.delete(capsuleId)
          return newSet
        })
        try {
          const likesRes = await api.getLikes(capsuleId)
          setLikes(prev => ({
            ...prev,
            [capsuleId]: {
              likes: likesRes.likes || [],
              likeCount: likesRes.likeCount || 0
            }
          }))
        } catch {}
      } else {
        console.error('Error removing like:', error)
      }
    }
  }

  const capsuleTypes = ['all', 'Personal', 'Career', 'Relationship', 'Birthday']
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'popular', label: 'Most Popular' }
  ]

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

  const renderCapsuleCard = (capsule) => (
    <motion.div
      key={capsule.id}
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -5 }}
      className="theme-card-hover overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold theme-text mb-2 truncate">
              {capsule.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`theme-badge ${
                capsule.type === 'Personal' ? 'theme-badge-primary' :
                capsule.type === 'Career' ? 'theme-badge-success' :
                capsule.type === 'Relationship' ? 'theme-badge-warning' :
                'theme-badge-purple'
              }`}>
                {capsule.type}
              </span>
              {capsule.isMultiUser && (
                <span className="theme-badge theme-badge-purple inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Multi</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Author and Date */}
        <div className="flex items-center space-x-2 mb-3 theme-text-muted text-sm">
          <Users className="h-4 w-4" />
          <span>{capsule.collaborators?.length || 1} contributors</span>
          <span>•</span>
          <span>{new Date(capsule.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Description */}
        <p className="theme-text-secondary text-sm line-clamp-3 mb-4">
          {capsule.message ? capsule.message.replace(/<[^>]*>/g, '') : 'No description available'}
        </p>

        {/* Media Preview */}
        {(() => {
          const timeUnlocked = new Date() >= new Date(capsule.unlockDate || capsule.createdAt)
          const canShowMedia = timeUnlocked && !(capsule.hasPassword && !capsule.isUnlocked)
          if (!canShowMedia || !capsule.media || capsule.media.length === 0) return null
          return (
            <div className="mb-4 flex space-x-2">
              {capsule.media.slice(0, 3).map((item, index) => (
                <div key={index} className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                  {item.type && item.type.startsWith('image') ? (
                    <img 
                      src={item.url} 
                      alt="Media" 
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="text-xs theme-text-muted">
                      {item.type && item.type.startsWith('video') ? 'Video' : 'Audio'}
                    </div>
                  )}
                </div>
              ))}
              {capsule.media.length > 3 && (
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                  <span className="theme-text-muted text-sm font-medium">
                    +{capsule.media.length - 3}
                  </span>
                </div>
              )}
            </div>
          )
        })()}
        
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
            Public
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 theme-divider">
          <div className="flex items-center space-x-2">
            <Link
              to={`/capsule/${capsule.id}`}
              className="theme-btn-ghost p-2"
              title="View Capsule"
            >
              <Eye className="h-4 w-4" />
            </Link>
            
            <button
              className={`theme-btn-ghost p-2 ${userLikes.has(capsule.id) ? 'text-red-500' : ''}`}
              title={userLikes.has(capsule.id) ? 'Unlike' : 'Like'}
              onClick={() => {
                if (userLikes.has(capsule.id)) {
                  handleRemoveLike(capsule.id)
                } else {
                  handleAddLike(capsule.id)
                }
              }}
            >
              <Heart className={`h-4 w-4 ${userLikes.has(capsule.id) ? 'fill-current' : ''}`} />
            </button>
            
            <button
              className="theme-btn-ghost p-2"
              title="Comment"
              onClick={() => setShowCommentModal(capsule.id)}
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
          
          <button
            className="theme-btn-ghost p-2"
            title="Share"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: capsule.title,
                  text: capsule.message?.replace(/<[^>]*>/g, '') || 'Check out this time capsule!',
                  url: window.location.origin + `/capsule/${capsule.id}`
                })
              } else {
                navigator.clipboard.writeText(window.location.origin + `/capsule/${capsule.id}`)
                alert('Link copied to clipboard!')
              }
            }}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderCapsuleListItem = (capsule) => (
    <motion.div
      key={capsule.id}
      variants={itemVariants}
      className="theme-card p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Globe className="h-6 w-6 theme-text-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold theme-text truncate">{capsule.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`theme-badge ${
                capsule.type === 'Personal' ? 'theme-badge-primary' :
                capsule.type === 'Career' ? 'theme-badge-success' :
                capsule.type === 'Relationship' ? 'theme-badge-warning' :
                'theme-badge-purple'
              }`}>
                {capsule.type}
              </span>
              <span className="theme-text-muted text-sm">
                {new Date(capsule.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm theme-text-muted">
            <Heart className="h-4 w-4" />
            <span>{capsule.likes || 0}</span>
            <MessageCircle className="h-4 w-4" />
            <span>{capsule.comments || 0}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              to={`/capsule/${capsule.id}`}
              className="theme-btn-ghost p-2"
              title="View Capsule"
            >
              <Eye className="h-4 w-4" />
            </Link>
            
            <button
              className="theme-btn-ghost p-2"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (publicCapsules.length === 0) {
    return (
      <div className="min-h-screen theme-bg pt-20">
        <div className="theme-container theme-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Globe className="h-16 w-16 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold theme-text mb-4">No Public Capsules</h2>
            <p className="theme-text-secondary text-lg mb-8 max-w-md mx-auto leading-relaxed">
              There are no public Chronos capsules available yet. Be the first to share your memories!
            </p>
            <Link to="/create" className="theme-btn-primary inline-flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create Your First Capsule</span>
            </Link>
          </motion.div>
        </div>
      </div>
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
          <h1 className="text-4xl font-bold theme-text mb-4">Public Capsules</h1>
          <p className="text-gray-400 mb-6">
            Discover and explore TimeVault capsules shared by the community
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="theme-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="theme-input"
              >
                {capsuleTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="theme-input"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
              <Globe className="h-24 w-24 theme-text-muted mx-auto mb-6" />
              <h3 className="text-2xl font-semibold theme-text mb-4">No capsules found</h3>
              <p className="theme-text-secondary mb-8">
                Try adjusting your search or filters
              </p>
            </motion.div>
          ) : (
            <div className={viewMode === 'grid' ? 'theme-grid' : 'space-y-4'}>
              <AnimatePresence>
                {filteredCapsules.map((capsule) => (
                  viewMode === 'grid' ? (
                    renderCapsuleCard(capsule)
                  ) : (
                    renderCapsuleListItem(capsule)
                  )
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

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

export default PublicCapsules 