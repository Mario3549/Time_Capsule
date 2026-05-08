import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Download, 
  Trash2,
  Edit3,
  Save,
  X,
  Camera,
  Mail,
  Calendar,
  Archive,
  Heart,
  Globe,
  Lock,
  Upload,
  RefreshCw,
  Settings,
  LogOut,
  Users
} from 'lucide-react'
import { useCapsules } from '../context/CapsuleContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import toast from 'react-hot-toast'
import apiService from '../services/api'

// WhatsApp-style Image Cropper
const ImageCropper = ({ image, onCrop, onCancel }) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageRef, setImageRef] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [previewImage, setPreviewImage] = useState(null)

  // Set container size on mount
  useEffect(() => {
    const updateContainerSize = () => {
      const container = document.querySelector('.image-cropper-container')
      if (container) {
        setContainerSize({
          width: container.offsetWidth,
          height: container.offsetHeight
        })
      }
    }
    
    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    return () => window.removeEventListener('resize', updateContainerSize)
  }, [])

  const handleImageLoad = (e) => {
    const img = e.target
    setImageRef(img)
    
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight
    setImageSize({ width: naturalWidth, height: naturalHeight })
    
    // Wait for container size to be set
    setTimeout(() => {
      const container = document.querySelector('.image-cropper-container')
      if (container && containerSize.width > 0) {
        // Set initial scale to maximum zoom out (minimum scale) where crop circle just touches image boundaries
        const cropSize = 300
        const minScaleX = cropSize / naturalWidth
        const minScaleY = cropSize / naturalHeight
        const initialScale = Math.max(minScaleX, minScaleY) // Maximum zoom out - crop circle touches image edges
        
        setScale(initialScale)
        
        // Center the image initially
        const scaledWidth = naturalWidth * initialScale
        const scaledHeight = naturalHeight * initialScale
        const centerX = (containerSize.width - scaledWidth) / 2
        const centerY = (containerSize.height - scaledHeight) / 2
        
        setPosition({ x: centerX, y: centerY })
      }
    }, 100)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Calculate image dimensions at current scale
    const scaledWidth = imageSize.width * scale
    const scaledHeight = imageSize.height * scale
    
    // Get container dimensions
    const containerWidth = containerSize.width
    const containerHeight = containerSize.height
    
    // Calculate crop circle radius (150px from center)
    const cropRadius = 150
    
    // Constrain position to keep crop circle within image bounds
    // The crop circle center must be at least cropRadius pixels from image edges
    const maxX = Math.max(0, (scaledWidth - containerWidth) / 2)
    const maxY = Math.max(0, (scaledHeight - containerHeight) / 2)
    
    // Calculate image boundaries
    const imageLeft = (containerWidth - scaledWidth) / 2
    const imageRight = imageLeft + scaledWidth
    const imageTop = (containerHeight - scaledHeight) / 2
    const imageBottom = imageTop + scaledHeight
    
    // Calculate crop circle boundaries
    const cropLeft = containerWidth / 2 + newX - cropRadius
    const cropRight = containerWidth / 2 + newX + cropRadius
    const cropTop = containerHeight / 2 + newY - cropRadius
    const cropBottom = containerHeight / 2 + newY + cropRadius
    
    // Adjust position to keep crop circle within image boundaries
    let constrainedX = newX
    let constrainedY = newY
    
    // Horizontal constraints
    if (cropLeft < imageLeft) {
      constrainedX = imageLeft + cropRadius - containerWidth / 2
    } else if (cropRight > imageRight) {
      constrainedX = imageRight - cropRadius - containerWidth / 2
    }
    
    // Vertical constraints
    if (cropTop < imageTop) {
      constrainedY = imageTop + cropRadius - containerHeight / 2
    } else if (cropBottom > imageBottom) {
      constrainedY = imageBottom - cropRadius - containerHeight / 2
    }
    
    // Apply container bounds
    constrainedX = Math.max(-maxX, Math.min(constrainedX, maxX))
    constrainedY = Math.max(-maxY, Math.min(constrainedY, maxY))
    
    setPosition({
      x: constrainedX,
      y: constrainedY
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    
    // Calculate minimum scale to ensure image covers the entire crop circle (300px diameter)
    // The crop circle is 300px, so we need the image to be at least 300px in the smaller dimension
    const cropSize = 300
    const minScaleX = cropSize / imageSize.width
    const minScaleY = cropSize / imageSize.height
    const minScale = Math.max(minScaleX, minScaleY) // Use max to ensure image covers full circle
    
    const newScale = Math.max(minScale, Math.min(scale * delta, 5)) // Prevent zoom out beyond crop coverage
    
    // Calculate zoom center relative to container
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calculate the point on the image that the mouse is over
    const imageX = (mouseX - containerSize.width / 2 - position.x) / scale
    const imageY = (mouseY - containerSize.height / 2 - position.y) / scale
    
    // Calculate new position to keep the same point under the mouse
    const newX = mouseX - containerSize.width / 2 - imageX * newScale
    const newY = mouseY - containerSize.height / 2 - imageY * newScale
    
    // Apply constraints
    const scaledWidth = imageSize.width * newScale
    const scaledHeight = imageSize.height * newScale
    const maxX = Math.max(0, (scaledWidth - containerSize.width) / 2)
    const maxY = Math.max(0, (scaledHeight - containerSize.height) / 2)
    
    // Calculate crop circle radius (150px from center)
    const cropRadius = 150
    
    // Calculate image boundaries
    const imageLeft = (containerSize.width - scaledWidth) / 2
    const imageRight = imageLeft + scaledWidth
    const imageTop = (containerSize.height - scaledHeight) / 2
    const imageBottom = imageTop + scaledHeight
    
    // Calculate crop circle boundaries
    const cropLeft = containerSize.width / 2 + newX - cropRadius
    const cropRight = containerSize.width / 2 + newX + cropRadius
    const cropTop = containerSize.height / 2 + newY - cropRadius
    const cropBottom = containerSize.height / 2 + newY + cropRadius
    
    // Adjust position to keep crop circle within image boundaries
    let constrainedX = newX
    let constrainedY = newY
    
    // Horizontal constraints
    if (cropLeft < imageLeft) {
      constrainedX = imageLeft + cropRadius - containerSize.width / 2
    } else if (cropRight > imageRight) {
      constrainedX = imageRight - cropRadius - containerSize.width / 2
    }
    
    // Vertical constraints
    if (cropTop < imageTop) {
      constrainedY = imageTop + cropRadius - containerSize.height / 2
    } else if (cropBottom > imageBottom) {
      constrainedY = imageBottom - cropRadius - containerSize.height / 2
    }
    
    // Apply container bounds
    constrainedX = Math.max(-maxX, Math.min(constrainedX, maxX))
    constrainedY = Math.max(-maxY, Math.min(constrainedY, maxY))
    
    setScale(newScale)
    setPosition({
      x: constrainedX,
      y: constrainedY
    })
  }

  const handleZoomIn = () => {
    const newScale = Math.min(5, scale * 1.2)
    setScale(newScale)
  }

  const handleZoomOut = () => {
    // Calculate minimum scale to ensure image covers the entire crop circle (300px diameter)
    const cropSize = 300
    const minScaleX = cropSize / imageSize.width
    const minScaleY = cropSize / imageSize.height
    const minScale = Math.max(minScaleX, minScaleY) // Use max to ensure image covers full circle
    
    const newScale = Math.max(minScale, scale * 0.8)
    
    // Ensure position is valid for the new scale
    const scaledWidth = imageSize.width * newScale
    const scaledHeight = imageSize.height * newScale
    const maxX = Math.max(0, (scaledWidth - containerSize.width) / 2)
    const maxY = Math.max(0, (scaledHeight - containerSize.height) / 2)
    
    // Calculate crop circle radius (150px from center)
    const cropRadius = 150
    
    // Calculate image boundaries
    const imageLeft = (containerSize.width - scaledWidth) / 2
    const imageRight = imageLeft + scaledWidth
    const imageTop = (containerSize.height - scaledHeight) / 2
    const imageBottom = imageTop + scaledHeight
    
    // Calculate current crop circle boundaries
    const cropLeft = containerSize.width / 2 + position.x - cropRadius
    const cropRight = containerSize.width / 2 + position.x + cropRadius
    const cropTop = containerSize.height / 2 + position.y - cropRadius
    const cropBottom = containerSize.height / 2 + position.y + cropRadius
    
    // Adjust position to keep crop circle within image boundaries
    let constrainedX = position.x
    let constrainedY = position.y
    
    // Horizontal constraints
    if (cropLeft < imageLeft) {
      constrainedX = imageLeft + cropRadius - containerSize.width / 2
    } else if (cropRight > imageRight) {
      constrainedX = imageRight - cropRadius - containerSize.width / 2
    }
    
    // Vertical constraints
    if (cropTop < imageTop) {
      constrainedY = imageTop + cropRadius - containerSize.height / 2
    } else if (cropBottom > imageBottom) {
      constrainedY = imageBottom - cropRadius - containerSize.height / 2
    }
    
    // Apply container bounds
    constrainedX = Math.max(-maxX, Math.min(constrainedX, maxX))
    constrainedY = Math.max(-maxY, Math.min(constrainedY, maxY))
    
    setScale(newScale)
    setPosition({ x: constrainedX, y: constrainedY })
  }

  // Update preview when position or scale changes
  const updatePreview = () => {
    if (!imageRef || containerSize.width === 0) return
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Use higher resolution for better quality
    const previewSize = 200
    canvas.width = previewSize
    canvas.height = previewSize
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Create circular clipping path for preview
    ctx.beginPath()
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, 2 * Math.PI)
    ctx.clip()
    
    // Calculate the center of the crop area (center of the container)
    const cropCenterX = containerSize.width / 2
    const cropCenterY = containerSize.height / 2
    
    // Calculate the crop size in image coordinates (300px crop area)
    const cropSize = 300 / scale
    
    // Calculate the source rectangle from the image
    // The image is centered in the container, so we need to account for the image's position
    const imageCenterX = containerSize.width / 2 + position.x
    const imageCenterY = containerSize.height / 2 + position.y
    
    // Calculate the source coordinates relative to the image
    const sourceX = (cropCenterX - imageCenterX) / scale + (imageSize.width - cropSize) / 2
    const sourceY = (cropCenterY - imageCenterY) / scale + (imageSize.height - cropSize) / 2
    
    // Draw the cropped circular image with higher quality
    ctx.drawImage(
      imageRef,
      sourceX, sourceY, cropSize, cropSize,
      0, 0, previewSize, previewSize
    )
    
    const previewDataUrl = canvas.toDataURL('image/jpeg', 0.95)
    setPreviewImage(previewDataUrl)
  }

  // Update preview when scale or position changes
  useEffect(() => {
    updatePreview()
  }, [scale, position, imageRef, containerSize])

  const handleCrop = () => {
    if (!imageRef) return
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 300
    canvas.height = 300
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Create circular clipping path for avatar
    ctx.beginPath()
    ctx.arc(150, 150, 150, 0, 2 * Math.PI)
    ctx.clip()
    
    // Calculate the center of the crop area (center of the container)
    const cropCenterX = containerSize.width / 2
    const cropCenterY = containerSize.height / 2
    
    // Calculate the crop size in image coordinates (300px crop area)
    const cropSize = 300 / scale
    
    // Calculate the source rectangle from the image
    // The image is centered in the container, so we need to account for the image's position
    const imageCenterX = containerSize.width / 2 + position.x
    const imageCenterY = containerSize.height / 2 + position.y
    
    // Calculate the source coordinates relative to the image
    const sourceX = (cropCenterX - imageCenterX) / scale + (imageSize.width - cropSize) / 2
    const sourceY = (cropCenterY - imageCenterY) / scale + (imageSize.height - cropSize) / 2
    
    // Draw the cropped circular image with high quality
    ctx.drawImage(
      imageRef,
      sourceX, sourceY, cropSize, cropSize,
      0, 0, 300, 300
    )
    
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95)
    onCrop(croppedDataUrl)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-6xl max-h-[90vh] flex">
        {/* Main Image Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Controls - WhatsApp Style */}
          <div className="flex items-center justify-center p-4 bg-gray-900">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Zoom out"
              >
                <svg viewBox="0 0 28 28" height="16" width="16" className="fill-current">
                  <path d="M8.381,14.803v-1.605h11.237v1.605C19.618,14.803,8.381,14.803,8.381,14.803z"></path>
                </svg>
              </button>
              <button
                onClick={handleZoomIn}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Zoom in"
              >
                <svg viewBox="0 0 24 24" height="16" width="16" className="fill-current">
                  <path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Image Canvas Area */}
          <div className="flex-1 relative overflow-hidden bg-gray-800 image-cropper-container">
          <div 
            className="relative w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              width: '100%', 
              height: '100%'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                ref={setImageRef}
                src={image}
                alt="Crop preview"
                className="block select-none max-w-none"
                draggable={false}
                onLoad={handleImageLoad}
                style={{
                  width: imageSize.width * scale,
                  height: imageSize.height * scale,
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
            
            {/* Circular crop overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative">
                {/* Dark overlay with circular cutout */}
                <div 
                  className="absolute inset-0 bg-black/60"
                  style={{
                    clipPath: `circle(150px at 150px 150px)`,
                    WebkitClipPath: `circle(150px at 150px 150px)`,
                    width: '300px',
                    height: '300px',
                    margin: '-150px'
                  }}
                ></div>
                
                {/* Circular border */}
                <div
                  className="absolute border-2 border-white shadow-lg rounded-full"
                  style={{
                    width: '300px',
                    height: '300px',
                    top: '-150px',
                    left: '-150px'
                  }}
                >
                </div>
                
              </div>
            </div>
          </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-center p-4 bg-gray-900">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors mr-4"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Submit image"
            >
              <svg viewBox="0 0 30 30" height="24" width="24" className="fill-current">
                <path d="M9.9,21.25l-6.7-6.7L1,16.75l8.9,8.9L29,6.55l-2.2-2.2L9.9,21.25z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Side Preview Section */}
        <div className="w-80 bg-gray-900 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Profile Preview</h3>
            <p className="text-gray-400 text-sm">This is how your profile picture will look</p>
          </div>
          
          {/* Large Preview Circle */}
          <div className="relative mb-6">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <span className="text-white text-2xl">...</span>
                </div>
              )}
            </div>
            
          </div>
          
          {/* Instructions */}
          <div className="text-center text-gray-400 text-sm space-y-2">
            <p>• Drag to move the image</p>
            <p>• Scroll to zoom in/out</p>
            <p>• Use +/- buttons for precise control</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Profile = () => {
  const { capsules, publicCapsules, memories, importData } = useCapsules()
  const { theme, setThemeMode } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showClearCacheModal, setShowClearCacheModal] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [originalProfileData, setOriginalProfileData] = useState({
    name: '',
    email: '',
    avatar: null,
    bio: '',
    notifications: {
      email: true,
      push: true,
      reminders: true
    },
    privacy: {
      publicProfile: false,
      showStats: true,
      allowCollaboration: true
    }
  })
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: null,
    bio: '',
    notifications: {
      email: true,
      push: true,
      reminders: true
    },
    privacy: {
      publicProfile: false,
      showStats: true,
      allowCollaboration: true
    }
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true)
        const response = await apiService.getProfile()
        
        if (response.success) {
          const userData = {
            name: response.user.name || '',
            email: response.user.email || '',
            avatar: response.user.profilePicture || null,
            bio: response.user.bio || '',
            createdAt: response.user.createdAt || null,
            notifications: {
              email: true,
              push: true,
              reminders: true
            },
            privacy: {
              publicProfile: false,
              showStats: true,
              allowCollaboration: true
            }
          }
          
          setProfileData(userData)
          setOriginalProfileData(userData)
        } else {
          // Fallback to localStorage if API fails
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            const user = JSON.parse(storedUser)
            const userData = {
              name: user.name || '',
              email: user.email || '',
              avatar: null,
              bio: '',
              createdAt: user.createdAt || null,
              notifications: {
                email: true,
                push: true,
                reminders: true
              },
              privacy: {
                publicProfile: false,
                showStats: true,
                allowCollaboration: true
              }
            }
            setProfileData(userData)
            setOriginalProfileData(userData)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // Fallback to localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          const userData = {
            name: user.name || '',
            email: user.email || '',
            avatar: null,
            bio: '',
            createdAt: user.createdAt || null,
            notifications: {
              email: true,
              push: true,
              reminders: true
            },
            privacy: {
              publicProfile: false,
              showStats: true,
              allowCollaboration: true
            }
          }
          setProfileData(userData)
          setOriginalProfileData(userData)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ]

  const daysActive = (() => {
    const ts = profileData.createdAt || (JSON.parse(localStorage.getItem('user') || '{}').createdAt);
    if (!ts) return 0;
    const created = new Date(ts)
    const now = new Date()
    const diffMs = now - created
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  })()

  const stats = [
    { label: 'Total Capsules', value: capsules.length, icon: Archive, color: 'from-blue-400 to-blue-600' },
    { label: 'Collaborations', value: memories.length, icon: Users, color: 'from-green-400 to-green-600' },
    { label: 'Memories', value: memories.length, icon: Heart, color: 'from-pink-400 to-pink-600' },
    { label: 'Days Active', value: daysActive, icon: Calendar, color: 'from-purple-400 to-purple-600' }
  ]

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = (type, value) => {
    setProfileData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value
      }
    }))
  }

  const handlePrivacyChange = (type, value) => {
    setProfileData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [type]: value
      }
    }))
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Check if file is an image with more supported formats
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
      if (!supportedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF)')
        return
      }
      
      // Increased file size limit to 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB')
        return
      }
      
      // Read file and show crop modal
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target.result)
        setShowCropModal(true)
      }
      
      reader.onerror = () => {
        toast.error('Failed to read file')
      }
      
      reader.readAsDataURL(file)
    }
    
    // Reset the input value so the same file can be selected again
    event.target.value = ''
  }

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.updateProfile({
        name: profileData.name,
        bio: profileData.bio,
        profilePicture: profileData.avatar || null,
        preferences: {
          notifications: profileData.notifications,
          privacy: profileData.privacy
        }
      })
      
      if (response.success) {
        setOriginalProfileData({...profileData})
        // keep local userData in sync for future sessions
        try {
          const userRaw = localStorage.getItem('userData') || localStorage.getItem('user')
          if (userRaw) {
            const userObj = JSON.parse(userRaw)
            userObj.profilePicture = response.user?.profilePicture || profileData.avatar || null
            localStorage.setItem('userData', JSON.stringify(userObj))
          }
        } catch {}
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        toast.error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setProfileData({...originalProfileData})
    setIsEditing(false)
    toast.info('Changes cancelled')
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const handleCropImage = (croppedImageData) => {
    setIsUploadingAvatar(true)
    toast.loading('Processing cropped image...', { id: 'avatar-upload' })
    
    // Create a new image to compress the cropped result
    const img = new Image()
    img.onload = () => {
      // Create canvas for final compression
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set dimensions to 300x300 for avatar
      const size = 300
      canvas.width = size
      canvas.height = size
      
      // Draw the cropped image
      ctx.drawImage(img, 0, 0, size, size)
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      setProfileData(prev => ({
        ...prev,
        avatar: compressedDataUrl
      }))
      
      setIsUploadingAvatar(false)
      setShowCropModal(false)
      setSelectedImage(null)
      toast.success('Avatar updated successfully', { id: 'avatar-upload' })
    }
    
    img.onerror = () => {
      setIsUploadingAvatar(false)
      toast.error('Failed to process cropped image', { id: 'avatar-upload' })
    }
    
    img.src = croppedImageData
  }

  const handleCancelCrop = () => {
    setShowCropModal(false)
    setSelectedImage(null)
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      setIsLoading(true)
      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      if (response.success) {
        setShowPasswordModal(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast.success('Password changed successfully')
      } else {
        toast.error(response.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setShowDeleteModal(false)
      setIsLoading(true)
      
      // Call API to delete account
      const response = await apiService.deleteAccount()
      
      if (response.success) {
        // Clear all user data from localStorage
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        
        // Show success message
        toast.success('Account deleted successfully')
        
        // Redirect to login page
        navigate('/login', { replace: true })
      } else {
        toast.error(response.message || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportData = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          importData(data)
          toast.success('Data imported successfully')
        } catch (error) {
          toast.error('Invalid file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleClearCache = () => {
    setShowClearCacheModal(false)
    toast.success('Cache cleared successfully')
  }

  const exportData = () => {
      const data = {
      capsules,
      publicCapsules,
      memories,
        profile: profileData,
      exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
    a.download = `capsule-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    toast.success('Data exported successfully')
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

  const renderProfileTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Profile Header */}
      <motion.div variants={itemVariants} className="theme-card p-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold theme-text">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-400 dark:hover:bg-primary-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        <div className="flex flex-col xl:flex-row items-start space-y-8 xl:space-y-0 xl:space-x-12">
          {/* Avatar */}
          <div className="flex-shrink-0">
          <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
              {profileData.avatar ? (
                <img 
                  src={profileData.avatar} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                profileData.name.charAt(0).toUpperCase()
              )}
            </div>
            {isEditing && (
                <label className={`absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg transition-transform ${isUploadingAvatar ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}`}>
                  {isUploadingAvatar ? (
                    <div className="h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="h-5 w-5 theme-text" />
                  )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            )}
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 w-full">
            <div className="space-y-6">
              {/* Name and Email Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="theme-form-label block text-sm font-semibold mb-2">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-300 shadow-sm"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                      <p className="theme-text font-medium text-lg">{profileData.name}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="theme-form-label block text-sm font-semibold mb-2">Email Address</label>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                    <Mail className="h-5 w-5 theme-text-muted flex-shrink-0" />
                    <p className="theme-text font-medium text-lg">{profileData.email}</p>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-2">
                <label className="theme-form-label block text-sm font-semibold mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-300 shadow-sm resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 min-h-[100px]">
                    <p className="theme-text-secondary text-lg leading-relaxed">{profileData.bio}</p>
                  </div>
                )}
              </div>

            {isEditing && (
              <div className="flex items-center justify-start space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleSaveProfile}
                  className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-400 dark:hover:bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="theme-card p-8">
        <h3 className="text-xl font-semibold theme-text mb-6">Your Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 dark:from-white/5 dark:to-white/0 border border-gray-200 dark:border-white/20"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold theme-text mb-2">{stat.value}</div>
              <div className="theme-text-secondary text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={itemVariants} className="theme-card p-8">
        <h3 className="text-xl font-semibold theme-text mb-6">Data Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium theme-text">Export & Import</h4>
            <div className="space-y-3">
          <button
            onClick={exportData}
                className="theme-btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
          </button>
          
              <label className="theme-btn-secondary w-full flex items-center justify-center space-x-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Import Data</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium theme-text">Account Actions</h4>
            <div className="space-y-3">
          <button
            onClick={() => setShowPasswordModal(true)}
                className="theme-btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
          </button>
          
          <button
            onClick={() => setShowClearCacheModal(true)}
                className="theme-btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Clear Cache</span>
          </button>
          
          <button
            onClick={handleLogout}
                className="theme-btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
                className="theme-btn-danger w-full flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )

  const renderNotificationsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="theme-card p-8"
    >
      <h2 className="text-2xl font-bold theme-text mb-6">Notification Settings</h2>
        <div className="space-y-6">
          {Object.entries(profileData.notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-white/20 dark:bg-white/5 rounded-lg">
            <div>
              <h3 className="font-medium theme-text capitalize">{key} Notifications</h3>
              <p className="theme-text-secondary text-sm">
                Receive notifications via {key === 'email' ? 'email' : key === 'push' ? 'push notifications' : 'reminder alerts'}
                </p>
              </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-primary-400"></div>
              </label>
            </div>
          ))}
      </div>
    </motion.div>
  )

  const renderPrivacyTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="theme-card p-8"
    >
      <h2 className="text-2xl font-bold theme-text mb-6">Privacy Settings</h2>
        <div className="space-y-6">
          {Object.entries(profileData.privacy).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-white/20 dark:bg-white/5 rounded-lg">
            <div>
              <h3 className="font-medium theme-text">
                {key === 'publicProfile' ? 'Public Profile' : 
                 key === 'showStats' ? 'Show Statistics' : 'Allow Collaboration'}
              </h3>
              <p className="theme-text-secondary text-sm">
                {key === 'publicProfile' ? 'Make your profile visible to other users' :
                 key === 'showStats' ? 'Display your capsule statistics publicly' :
                 'Allow others to collaborate on your capsules'}
                </p>
              </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handlePrivacyChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-primary-400"></div>
              </label>
            </div>
          ))}
      </div>
    </motion.div>
  )

  const renderAppearanceTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="theme-card p-8"
    >
      <h2 className="text-2xl font-bold theme-text mb-6">Appearance Settings</h2>
      <div className="space-y-6">
        <div className="p-4 bg-white/20 dark:bg-white/5 rounded-lg">
          <h3 className="font-medium theme-text mb-4">Theme</h3>
              <ThemeToggle />
        </div>
      </div>
    </motion.div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab()
      case 'notifications':
        return renderNotificationsTab()
      case 'privacy':
        return renderPrivacyTab()
      case 'appearance':
        return renderAppearanceTab()
      default:
        return renderProfileTab()
    }
  }

  if (isLoading && !profileData.name) {
    return (
      <div className="min-h-screen theme-bg pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="theme-text-secondary">Loading profile...</p>
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
          <h1 className="text-4xl font-bold theme-text mb-4">Profile & Settings</h1>
          <p className="theme-text-secondary text-lg">
            Manage your account, preferences, and data
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="theme-card p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                      : 'theme-btn-ghost'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
          </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

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
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="theme-modal-content max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold theme-text mb-2">
                Change password
              </h3>
              <p className="theme-text-secondary text-sm mb-5">
                Enter your current password and choose a strong new one.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="theme-form-label mb-1 block">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))
                    }
                    className="theme-input w-full"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="theme-form-label mb-1 block">
                    New password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))
                    }
                    className="theme-input w-full"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="theme-form-label mb-1 block">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    className="theme-input w-full"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="theme-btn-primary"
                >
                  Change password
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
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
              <h3 className="text-xl font-semibold theme-text mb-4">Delete Account</h3>
              <p className="theme-text-secondary mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="theme-btn-danger"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>

      {/* Clear Cache Modal */}
      <AnimatePresence>
      {showClearCacheModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowClearCacheModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="theme-modal-content p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold theme-text mb-4">Clear Cache</h3>
              <p className="theme-text-secondary mb-6">
                This will clear all cached data and temporary files. Your capsules and settings will remain intact.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowClearCacheModal(false)}
                  className="theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCache}
                  className="theme-btn-primary"
                >
                  Clear Cache
                </button>
              </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>

      {/* Image Crop Modal */}
      <AnimatePresence>
      {showCropModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={handleCancelCrop}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="theme-modal-content max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold theme-text mb-4">Crop Your Avatar</h3>
                <p className="theme-text-secondary mb-6">
                  Drag to move and resize the crop area to select the part of the image you want as your avatar.
                </p>
                
                <div className="relative mb-6">
                  <ImageCropper 
                    image={selectedImage}
                    onCrop={handleCropImage}
                    onCancel={handleCancelCrop}
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={handleCancelCrop}
                    className="theme-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

export default Profile 