import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Heart,
  Star,
  Users,
  MessageCircle,
  Send,
  Sparkles,
  Clock,
  X
} from 'lucide-react'
import { useCapsules } from '../context/CapsuleContext'
import CountdownTimer from '../components/CountdownTimer'
import api from '../services/api'
import toast from 'react-hot-toast'

// Helper function to get user info from localStorage
const getUserInfo = () => {
  try {
    const userData = localStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

const CollaborationPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getCapsuleById } = useCapsules()
  const [capsule, setCapsule] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState([])
  
  // Comments and likes state
  const [comments, setComments] = useState([])
  const [likes, setLikes] = useState([])
  const [likeCount, setLikeCount] = useState(0)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [userLikes, setUserLikes] = useState(new Set())

  useEffect(() => {
    const foundCapsule = getCapsuleById(id)
    if (foundCapsule && foundCapsule.isMultiUser) {
      setCapsule(foundCapsule)
      // Simulate some collaborative messages
      setMessages([
        {
          id: 1,
          author: 'Alice',
          message: 'I can\'t wait to see what we\'ve all written! 💕',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          avatar: 'A'
        },
        {
          id: 2,
          author: 'Bob',
          message: 'This is going to be amazing when it unlocks!',
          timestamp: new Date(Date.now() - 43200000).toISOString(),
          avatar: 'B'
        },
        {
          id: 3,
          author: 'Charlie',
          message: 'I\'ve added some special memories to this capsule 🎉',
          timestamp: new Date(Date.now() - 21600000).toISOString(),
          avatar: 'C'
        }
      ])
    } else {
      navigate('/vault')
    }
  }, [id, getCapsuleById, navigate])

  // Load comments and likes for the capsule
  useEffect(() => {
    const loadCapsuleData = async () => {
      if (capsule) {
        try {
          const [commentsRes, likesRes] = await Promise.all([
            api.getComments(capsule.id),
            api.getLikes(capsule.id)
          ])
          
          setComments(commentsRes.comments || [])
          setLikes(likesRes.likes || [])
          setLikeCount(likesRes.likeCount || 0)
          
          // Check if current user has liked this capsule
          const userInfo = getUserInfo()
          if (userInfo && likesRes.likes) {
            const hasLiked = likesRes.likes.some(like => 
              like.userId === userInfo.id || 
              (like.userName === userInfo.name && like.userEmail === userInfo.email)
            )
            if (hasLiked) {
              setUserLikes(prev => new Set([...prev, capsule.id]))
            }
          }
        } catch (error) {
          console.error('Error loading capsule data:', error)
        }
      }
    }
    
    loadCapsuleData()
  }, [capsule])

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !capsule) return
    
    const userInfo = getUserInfo()
    
    try {
      const response = await api.addComment(capsule.id, {
        userName: userInfo?.name || 'Anonymous',
        userEmail: userInfo?.email || '',
        content: newComment
      })
      
      setComments(prev => [...prev, response.comment])
      setNewComment('')
      setShowCommentModal(false)
      toast.success('Comment added successfully')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  // Handle adding a like
  const handleAddLike = async () => {
    if (!capsule) return
    
    const userInfo = getUserInfo()
    
    try {
      const response = await api.addLike(capsule.id, {
        userName: userInfo?.name || 'Anonymous',
        userEmail: userInfo?.email || ''
      })
      
      setLikes(prev => [...prev, response.like])
      setLikeCount(prev => prev + 1)
      setUserLikes(prev => new Set([...prev, capsule.id]))
      toast.success('Liked successfully')
    } catch (error) {
      // If user already liked, remove the like instead
      if (error.message.includes('Already liked')) {
        handleRemoveLike()
      } else {
        console.error('Error adding like:', error)
        toast.error('Failed to add like')
      }
    }
  }

  // Handle removing a like
  const handleRemoveLike = async () => {
    if (!capsule) return
    
    try {
      await api.removeLike(capsule.id)
      
      setLikeCount(prev => Math.max(0, prev - 1))
      setUserLikes(prev => {
        const newSet = new Set(prev)
        newSet.delete(capsule.id)
        return newSet
      })
      toast.success('Like removed')
    } catch (error) {
      console.error('Error removing like:', error)
      toast.error('Failed to remove like')
    }
  }

  if (!capsule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const isUnlocked = new Date() >= new Date(capsule.unlockDate)
  const collaborators = capsule.collaborators || ['Alice', 'Bob', 'Charlie', 'Diana']

  const getRandomAvatarColor = (name) => {
    const colors = [
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600'
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        author: 'You',
        message: newMessage,
        timestamp: new Date().toISOString(),
        avatar: 'Y'
      }
      setMessages(prev => [...prev, message])
      setNewMessage('')
    }
  }

  const timeUntilUnlock = new Date(capsule.unlockDate) - new Date()
  const progressPercentage = Math.max(0, Math.min(100, ((Date.now() - new Date(capsule.createdAt)) / (new Date(capsule.unlockDate) - new Date(capsule.createdAt))) * 100))

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 opacity-10"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Heart className="h-6 w-6 text-pink-400" />
              <h1 className="text-4xl font-bold theme-text mb-4">TimeVault Capsule</h1>
              <Star className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-white/70">Collaborative Chronos Capsule</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-secondary-400" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Collaboration Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            {/* Progress Ring */}
            <div className="capsule-card text-center mb-8">
              <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressPercentage / 100)}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - progressPercentage / 100) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{Math.round(progressPercentage)}%</div>
                    <div className="text-xs text-white/60">Complete</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                {isUnlocked ? (
                  <div className="text-green-400 font-semibold">Capsule Unlocked! 🎉</div>
                ) : (
                  <CountdownTimer unlockDate={capsule.unlockDate} />
                )}
              </div>
            </div>

            {/* Collaborative Messages */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Messages from Friends</h2>
              
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="relative"
                >
                  <div className="capsule-card">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRandomAvatarColor(message.author)}`}>
                        {message.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-white">{message.author}</span>
                          <span className="text-white/40 text-sm">
                            {new Date(message.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white/80 leading-relaxed">{message.message}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating sparkles */}
                  <motion.div
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                    className="absolute -top-2 -right-2 text-yellow-400"
                  >
                  </motion.div>
                </motion.div>
              ))}

              {/* Add Message */}
              <div className="capsule-card">
                <h3 className="text-lg font-semibold text-white mb-4">Add Your Message</h3>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a message to your friends..."
                    className="input-field flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Collaborators */}
            <div className="capsule-card">
              <h3 className="text-lg font-semibold text-white mb-4">Collaborators</h3>
              <div className="space-y-3">
                {collaborators.map((collaborator, index) => (
                  <motion.div
                    key={collaborator}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRandomAvatarColor(collaborator)}`}>
                      {collaborator.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-medium">{collaborator}</div>
                      <div className="text-white/60 text-sm">Active</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Capsule Info */}
            <div className="capsule-card">
              <h3 className="text-lg font-semibold text-white mb-4">Capsule Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Created:</span>
                  <span className="text-white">{new Date(capsule.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Unlock Date:</span>
                  <span className="text-white">{new Date(capsule.unlockDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Collaborators:</span>
                  <span className="text-white">{collaborators.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Messages:</span>
                  <span className="text-white">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Likes:</span>
                  <span className="text-white">{likeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Comments:</span>
                  <span className="text-white">{comments.length}</span>
                </div>
              </div>
              
              {/* Like and Comment Buttons */}
              <div className="mt-6 flex items-center space-x-4">
                <button
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    userLikes.has(capsule.id) 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-white/10 text-white hover:bg-white/20 hover:text-red-400'
                  }`}
                  onClick={() => {
                    if (userLikes.has(capsule.id)) {
                      handleRemoveLike()
                    } else {
                      handleAddLike()
                    }
                  }}
                >
                  <Heart className={`h-4 w-4 transition-all duration-200 ${
                    userLikes.has(capsule.id) ? 'fill-current' : ''
                  }`} />
                  <span>{userLikes.has(capsule.id) ? 'Unlike' : 'Like'}</span>
                </button>
                
                <button
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
                  onClick={() => setShowCommentModal(true)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Comment</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="capsule-card">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/capsule/${capsule.id}`)}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>View Capsule</span>
                </button>
                
                <button
                  onClick={() => navigate('/create-multi')}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Create New Multi</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Add a Comment</h3>
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="text-white/60 hover:text-white p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Comment *
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your comment..."
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowCommentModal(false)}
                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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

export default CollaborationPage 