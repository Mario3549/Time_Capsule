import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Calendar, 
  Clock, 
  Eye, 
  Trash2, 
  Edit3, 
  Share2,
  Filter,
  Search,
  Plus,
  Star,
  MessageCircle,
  ArrowRight
} from 'lucide-react'
import { useCapsules } from '../context/CapsuleContext'
import toast from 'react-hot-toast'

const Memories = () => {
  const { getMemories, deleteCapsule, removeFromMemories } = useCapsules()
  const memories = getMemories()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [filteredMemories, setFilteredMemories] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [memoryToDelete, setMemoryToDelete] = useState(null)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [memoryToRemove, setMemoryToRemove] = useState(null)

  useEffect(() => {
    let filtered = memories.filter(memory => 
      memory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.message.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (selectedType !== 'all') {
      filtered = filtered.filter(memory => memory.type === selectedType)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.unlockDate) - new Date(a.unlockDate)
        case 'oldest':
          return new Date(a.unlockDate) - new Date(b.unlockDate)
        case 'favorite':
          return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
        default:
          return 0
      }
    })

    setFilteredMemories(filtered)
  }, [memories, searchTerm, selectedType, sortBy])


  const handleDeleteMemory = (memory) => {
    setMemoryToDelete(memory)
    setShowDeleteModal(true)
  }

  const handleRemoveFromMemories = (memory) => {
    setMemoryToRemove(memory)
    setShowRemoveModal(true)
  }

  const confirmDelete = () => {
    if (memoryToDelete) {
      deleteCapsule(memoryToDelete.id)
      setShowDeleteModal(false)
      setMemoryToDelete(null)
      toast.success('Memory deleted successfully')
    }
  }

  const confirmRemove = () => {
    if (memoryToRemove) {
      removeFromMemories(memoryToRemove.id)
      setShowRemoveModal(false)
      setMemoryToRemove(null)
      toast.success('Removed from memories')
    }
  }

  const memoryTypes = ['all', 'Personal', 'Career', 'Relationship', 'Birthday']
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'favorite', label: 'Favorites First' }
  ]

  const getMemoryIcon = (type) => {
    switch (type) {
      case 'Personal': return '💭'
      case 'Career': return '💼'
      case 'Relationship': return '💕'
      case 'Birthday': return '🎂'
      default: return '📝'
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

  if (memories.length === 0) {
    return (
      <div className="min-h-screen theme-bg pt-20">
        <div className="theme-container theme-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8"
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
              <Heart className="h-16 w-16 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold theme-text mb-4">No Memories Yet</h2>
            <p className="theme-text-secondary text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Your unlocked Chronos capsules will appear here as precious memories to cherish.
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
          <h1 className="text-4xl font-bold theme-text mb-4">Memories</h1>
          <p className="text-gray-400 mb-6">
            Relive your unlocked TimeVault capsules and memories
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type="text"
                  placeholder="Search memories..."
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
                {memoryTypes.map(type => (
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
            </div>
          </div>
        </motion.div>

        {/* Memories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredMemories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Heart className="h-24 w-24 theme-text-muted mx-auto mb-6" />
              <h3 className="text-2xl font-semibold theme-text mb-4">No memories found</h3>
              <p className="theme-text-secondary mb-8">
                Try adjusting your search or filters
              </p>
            </motion.div>
          ) : (
            <div className="theme-grid">
              {filteredMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="theme-card-hover overflow-hidden h-full"
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold theme-text mb-2 truncate">
                          {memory.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="theme-badge theme-badge-primary">
                            {getMemoryIcon(memory.type)} {memory.type}
                          </span>
                          {memory.favorite && (
                            <span className="theme-badge theme-badge-warning">
                              <Star className="h-3 w-3 mr-1" />
                              Favorite
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center space-x-2 mb-4 theme-text-muted text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Unlocked {new Date(memory.unlockDate).toLocaleDateString()}</span>
                    </div>

                    {/* Message Preview (reserve space) */}
                    <div className="mb-4 min-h-[64px]">
                      <p className="theme-text-secondary text-sm line-clamp-3">
                        {(memory.message || '').replace(/<[^>]*>/g, '')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex items-center justify-between pt-4 theme-divider">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/capsule/${memory.id}`}
                          className="theme-btn-ghost p-2"
                          title="View Memory"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        <button
                          className="theme-btn-ghost p-2"
                          title="Share Memory"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveFromMemories(memory)}
                          className="theme-btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Remove from Memories"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteMemory(memory)}
                          className="theme-btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Delete Memory"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-xs theme-text-muted">Memory</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

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
              <h3 className="text-xl font-semibold theme-text mb-4">Delete Memory</h3>
              <p className="theme-text-secondary mb-6">
                Are you sure you want to delete "{memoryToDelete?.title}"? This action cannot be undone.
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

      {/* Remove from Memories Confirmation Modal */}
      <AnimatePresence>
        {showRemoveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-modal"
            onClick={() => setShowRemoveModal(false)}
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
                Are you sure you want to remove "{memoryToRemove?.title}" from your memories? The original capsule will remain in your vault.
              </p>
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
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

export default Memories 