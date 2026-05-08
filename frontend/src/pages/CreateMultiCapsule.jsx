import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Save, 
  Upload, 
  Calendar, 
  Lock, 
  Mail, 
  Users, 
  UserPlus,
  X,
  FileText,
  Image,
  Video,
  Music,
  Heart,
  Star,
  Eye,
  EyeOff
} from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useCapsules } from '../context/CapsuleContext'

// Helper function to get a specific day at midnight
const getDayAtMidnight = (daysFromNow = 1) => {
  const now = new Date()
  const targetDate = new Date(now)
  targetDate.setDate(targetDate.getDate() + daysFromNow)
  targetDate.setHours(0, 0, 0, 0) // Set to midnight (00:00:00.000)
  return targetDate
}

const createBurstParticles = () =>
  Array.from({ length: 14 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 14
    const distance = 220 + Math.random() * 320
    const upwardBias = Math.random() * 180
    return {
      x: Math.cos(angle) * distance,
      y: (Math.sin(angle) * distance) - upwardBias,
      delay: (i % 5) * 0.018,
      duration: 0.8 + (i % 3) * 0.14,
      size: 20 + (i % 4) * 5
    }
  })

const CreateMultiCapsule = () => {
  const navigate = useNavigate()
  const { addCapsule } = useCapsules()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [typeBurst, setTypeBurst] = useState(null)
  const [iconPulse, setIconPulse] = useState({ type: null, key: 0 })
  const burstTimeoutRef = useRef(null)
  const burstRafRef = useRef(null)
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    unlockDate: getDayAtMidnight(1), // Next day at midnight
    type: 'Personal',
    emailNotification: '',
    media: [],
    collaborators: [],
    hasPassword: false,
    password: '',
    confirmPassword: ''
  })

  const [newCollaborator, setNewCollaborator] = useState('')
  const [emailError, setEmailError] = useState('')

  const capsuleTypes = [
    { value: 'Personal', label: 'Personal', icon: '💭', color: 'from-blue-400 to-blue-600' },
    { value: 'Career', label: 'Career', icon: '💼', color: 'from-green-400 to-green-600' },
    { value: 'Relationship', label: 'Relationship', icon: '💕', color: 'from-pink-400 to-pink-600' },
    { value: 'Birthday', label: 'Birthday', icon: '🎂', color: 'from-yellow-400 to-yellow-600' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current)
      if (burstRafRef.current) cancelAnimationFrame(burstRafRef.current)
    }
  }, [])

  const handleTypeSelect = (event, typeValue, typeIcon) => {
    handleInputChange('type', typeValue)
    setIconPulse({ type: typeValue, key: Date.now() + Math.random() })

    const root = event.currentTarget.closest('[data-type-burst-root]')
    const rootRect = root?.getBoundingClientRect()
    const buttonRect = event.currentTarget.getBoundingClientRect()
    const originX = (buttonRect.left - (rootRect?.left || 0)) + (buttonRect.width / 2)
    const originY = (buttonRect.top - (rootRect?.top || 0)) + (buttonRect.height / 2)

    const nextBurst = {
      key: Date.now() + Math.random(),
      emoji: typeIcon,
      originX,
      originY,
      particles: createBurstParticles()
    }

    if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current)
    if (burstRafRef.current) cancelAnimationFrame(burstRafRef.current)

    // Reset first to reliably restart animation on every tap.
    setTypeBurst(null)
    burstRafRef.current = requestAnimationFrame(() => {
      setTypeBurst(nextBurst)
      burstTimeoutRef.current = setTimeout(() => setTypeBurst(null), 1200)
    })
  }

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const addCollaborator = () => {
    const email = newCollaborator.trim()
    
    if (!email) {
      setEmailError('Please enter an email address')
      return
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    if (formData.collaborators.includes(email)) {
      setEmailError('This email is already added')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, email]
    }))
    setNewCollaborator('')
    setEmailError('')
  }

  const removeCollaborator = (email) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c !== email)
    }))
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    const newMedia = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 'audio',
      url: URL.createObjectURL(file)
    }))
    
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...newMedia]
    }))
  }

  const removeMedia = (id) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter(item => item.id !== id)
    }))
  }



  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate that at least one collaborator is added
    if (formData.collaborators.length === 0) {
      toast.error('Add at least one collaborator', {
        style: {
          background: '#dc2626',
          color: '#ffffff',
        }
      })
      return
    }
    
    // Validate password if enabled
    if (formData.hasPassword) {
      if (!formData.password || !formData.confirmPassword) {
        toast.error('Please enter password', {
          style: {
            background: '#dc2626',
            color: '#ffffff',
          }
        })
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords don\'t match', {
          style: {
            background: '#dc2626',
            color: '#ffffff',
          }
        })
        return
      }
      if (formData.password.length < 4) {
        toast.error('Password too short', {
          style: {
            background: '#dc2626',
            color: '#ffffff',
          }
        })
        return
      }
    }
    
    setIsSubmitting(true)
    try {
      const newCapsule = {
        ...formData,
        unlockDate: formData.unlockDate.toISOString(),
        media: formData.media,
        isMultiUser: true,
        password: formData.hasPassword ? formData.password : null,
        isPublic: false
      }
      await addCapsule(newCapsule)
      toast.success('Multi-capsule created successfully!', {
        style: {
          background: '#1f2937',
          color: '#ffffff',
        }
      })
      navigate('/vault')
    } catch (err) {
      toast.error(err.message || 'Failed to create capsule')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMediaIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getRandomAvatarColor = (email) => {
    const colors = [
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600'
    ]
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  return (
    <div className="min-h-screen theme-bg relative overflow-hidden pb-20" data-type-burst-root>
      {/* Background decorations */}
      <div className="absolute inset-0 bg-stars opacity-10"></div>
      {typeBurst && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {typeBurst.particles.map((particle, idx) => (
            <motion.span
              key={`${typeBurst.key}-${idx}`}
              className="absolute select-none"
              style={{
                left: typeBurst.originX,
                top: typeBurst.originY,
                fontSize: particle.size,
                willChange: 'transform, opacity'
              }}
              initial={{ opacity: 0, scale: 0.2, x: -8, y: -8 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0.35, 1.15, 0.72],
                x: particle.x,
                y: particle.y
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut'
              }}
            >
              {typeBurst.emoji}
            </motion.span>
          ))}
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold theme-text mb-4">Create TimeVault Capsule</h1>
          </div>
          <p className="theme-text-secondary text-lg">Invite friends and family to collaborate on a special time capsule</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="theme-card p-8 space-y-8 rounded-2xl"
        >
          {/* Title */}
          <div className="space-y-3">
            <label className="theme-text font-medium text-lg">Capsule Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Give your collaborative capsule a meaningful title..."
              className="theme-input w-full text-lg rounded-2xl"
              required
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-4">
            <label className="theme-text font-medium text-lg">Capsule Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capsuleTypes.map((type) => {
                const getTypeColors = (typeValue) => {
                  switch (typeValue) {
                    case 'Personal':
                      return {
                        selected: 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-600/20',
                        hover: 'hover:border-blue-300 dark:hover:border-blue-400',
                        text: 'text-blue-700 dark:text-blue-300',
                        hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                        description: 'text-blue-600 dark:text-blue-400'
                      }
                    case 'Career':
                      return {
                        selected: 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/20 dark:to-green-600/20',
                        hover: 'hover:border-green-300 dark:hover:border-green-400',
                        text: 'text-green-700 dark:text-green-300',
                        hoverText: 'group-hover:text-green-600 dark:group-hover:text-green-400',
                        description: 'text-green-600 dark:text-green-400'
                      }
                    case 'Relationship':
                      return {
                        selected: 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-500/20 dark:to-pink-600/20',
                        hover: 'hover:border-pink-300 dark:hover:border-pink-400',
                        text: 'text-pink-700 dark:text-pink-300',
                        hoverText: 'group-hover:text-pink-600 dark:group-hover:text-pink-400',
                        description: 'text-pink-600 dark:text-pink-400'
                      }
                    case 'Birthday':
                      return {
                        selected: 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-500/20 dark:to-yellow-600/20',
                        hover: 'hover:border-yellow-300 dark:hover:border-yellow-400',
                        text: 'text-yellow-700 dark:text-yellow-300',
                        hoverText: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
                        description: 'text-yellow-600 dark:text-yellow-400'
                      }
                    default:
                      return {
                        selected: 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-600/20',
                        hover: 'hover:border-blue-300 dark:hover:border-blue-400',
                        text: 'text-blue-700 dark:text-blue-300',
                        hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                        description: 'text-blue-600 dark:text-blue-400'
                      }
                  }
                }

                const colors = getTypeColors(type.value)
                
                return (
                  <motion.button
                  key={type.value}
                  type="button"
                  onClick={(event) => handleTypeSelect(event, type.value, type.icon)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-visible group ${
                    formData.type === type.value
                        ? `${colors.selected} shadow-lg`
                        : `border-gray-200 dark:border-white/20 bg-white/20 dark:bg-white/5 ${colors.hover} hover:shadow-md`
                  }`}
                >
                  {formData.type === type.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                        className={`absolute inset-0 bg-gradient-to-br ${
                          type.value === 'Personal' ? 'from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20' :
                          type.value === 'Career' ? 'from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20' :
                          type.value === 'Relationship' ? 'from-pink-500/10 to-pink-600/10 dark:from-pink-500/20 dark:to-pink-600/20' :
                          'from-yellow-500/10 to-yellow-600/10 dark:from-yellow-500/20 dark:to-yellow-600/20'
                        }`}
                      />
                    )}
                    <div className="relative z-10 text-center">
                      <motion.div
                        key={`${type.value}-${iconPulse.type === type.value ? iconPulse.key : 'idle'}`}
                        className={`text-4xl mb-3 ${formData.type === type.value ? 'text-5xl' : ''}`}
                        animate={
                          formData.type === type.value
                            ? { scale: [1, 1.28, 1.08], rotate: [0, -6, 0] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.42, ease: 'easeOut' }}
                      >
                        {type.icon}
                      </motion.div>
                      <div className={`text-sm font-semibold transition-colors duration-300 ${
                        formData.type === type.value 
                          ? colors.text
                          : `theme-text ${colors.hoverText}`
                      }`}>
                        {type.label}
                      </div>
                      <div className={`text-xs mt-1 transition-opacity duration-300 ${
                        formData.type === type.value 
                          ? `${colors.description} opacity-100` 
                          : 'theme-text-muted opacity-0 group-hover:opacity-100'
                      }`}>
                        {type.value === 'Personal' && 'Personal thoughts & memories'}
                        {type.value === 'Career' && 'Professional achievements & goals'}
                        {type.value === 'Relationship' && 'Love, friendship & connections'}
                        {type.value === 'Birthday' && 'Birthday wishes & celebrations'}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Collaborators */}
          <div className="space-y-3">
            <label className="theme-text font-medium text-lg">Invite Collaborators *</label>
            <p className="theme-text-muted text-sm">At least one collaborator is required for multi-user capsules</p>
            <div className="flex space-x-2 mb-4">
              <input
                type="email"
                value={newCollaborator}
                onChange={(e) => {
                  setNewCollaborator(e.target.value)
                  if (emailError) setEmailError('')
                }}
                placeholder="friend@example.com"
                className={`theme-input flex-1 rounded-2xl ${emailError ? 'border-red-400' : ''}`}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCollaborator())}
              />
              <button
                type="button"
                onClick={addCollaborator}
                className="theme-btn-secondary flex items-center space-x-2 rounded-2xl"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
            {emailError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-2xl">
                <p className="text-red-400 text-sm flex items-center">
                  <span className="mr-2">⚠️</span>
                  {emailError}
                </p>
              </div>
            )}
            
            {/* Collaborator Avatars */}
            {formData.collaborators.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {formData.collaborators.map((email, index) => (
                  <motion.div
                    key={email}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-2xl ${getRandomAvatarColor(email)}`}
                  >
                    <span className="theme-text font-medium text-sm">
                      {email.split('@')[0].charAt(0).toUpperCase()}
                    </span>
                    <span className="theme-text text-sm">{email.split('@')[0]}</span>
                    <button
                      type="button"
                      onClick={() => removeCollaborator(email)}
                      className="theme-text-muted hover:theme-text transition-colors p-1 rounded-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Unlock Date */}
          <div className="space-y-3">
            <label className="theme-text font-medium text-lg">Unlock Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
              <DatePicker
                selected={formData.unlockDate}
                onChange={(date) => handleInputChange('unlockDate', date)}
                minDate={new Date()}
                className="theme-input w-full pl-12 text-lg rounded-2xl"
                dateFormat="MMMM d, yyyy"
                placeholderText="Select unlock date..."
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <label className="theme-text font-medium text-lg">Your Message</label>
            <div className="bg-white/20 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/20">
              <ReactQuill
                value={formData.message}
                onChange={(value) => handleInputChange('message', value)}
                placeholder="Write your message to the future..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
                theme="snow"
                style={{
                  backgroundColor: 'transparent',
                  color: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-4">
            <label className="theme-text font-medium text-lg">Add Media</label>
            <div className="border-2 border-dashed border-gray-200 dark:border-white/20 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="h-16 w-16 theme-text-muted mx-auto mb-4" />
              <p className="theme-text-secondary text-lg mb-6">Upload images, videos, or audio files</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="theme-btn-secondary cursor-pointer px-8 py-3 text-lg rounded-2xl">
                Choose Files
              </label>
            </div>
            
            {/* Media Preview */}
            {formData.media.length > 0 && (
              <div className="space-y-3">
                <h4 className="theme-text font-medium">Selected Files</h4>
                <div className="grid gap-3">
                {formData.media.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white/20 dark:bg-white/5 rounded-2xl p-4">
                      <div className="flex items-center space-x-4">
                        <div className="theme-text-muted">
                          {getMediaIcon(item.type)}
                        </div>
                        <span className="theme-text font-medium">{item.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                        className="theme-text-muted hover:text-red-400 transition-colors p-2 rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="space-y-6">
            <h3 className="theme-text font-semibold text-xl">Privacy Settings</h3>
            
          <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl">
              <div>
                  <p className="theme-text font-medium">Password Protection</p>
                  <p className="theme-text-muted text-sm">Add a password for extra privacy</p>
              </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasPassword}
                    onChange={(e) => handleInputChange('hasPassword', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-primary-400"></div>
                </label>
            </div>

            {/* Password Fields */}
            {formData.hasPassword && (
                <div className="space-y-4 p-6 bg-white/20 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/20">
                  <div className="space-y-3">
                    <label className="theme-text font-medium">Password</label>
                  <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter your password..."
                        className="theme-input w-full pl-12 rounded-2xl"
                      required={formData.hasPassword}
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
                
                  <div className="space-y-3">
                    <label className="theme-text font-medium">Confirm Password</label>
                  <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password..."
                        className="theme-input w-full pl-12 rounded-2xl"
                      required={formData.hasPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 theme-text-muted hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.hasPassword && formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-red-500 text-sm">Passwords do not match</p>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Email Notification */}
          <div className="space-y-3">
            <label className="theme-text font-medium text-lg">Email Notification (Optional)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
              <input
                type="email"
                value={formData.emailNotification}
                onChange={(e) => handleInputChange('emailNotification', e.target.value)}
                placeholder="your-email@example.com"
                className="theme-input w-full pl-12 rounded-2xl"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
            type="submit"
            disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3 text-lg relative overflow-hidden"
          >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Capsule...</span>
                </>
            ) : (
              <>
                  <Save className="h-6 w-6" />
                  <span>Create Multi-User Capsule</span>
              </>
            )}
            </button>
          </div>
        </motion.form>
      </div>


    </div>
  )
}

export default CreateMultiCapsule 