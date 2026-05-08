import React, { createContext, useContext, useReducer, useEffect } from 'react'
import api, { normalizeMediaUrl, mediaDownloadUrl } from '../services/api'

const CapsuleContext = createContext()

const initialState = {
  capsules: [],
  publicCapsules: [], // kept for backward compatibility, but no longer used for UI
  memories: [],
  loading: false,
  error: null
}

const capsuleReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'ADD_CAPSULE':
      return { 
        ...state, 
        capsules: [...state.capsules, action.payload],
        publicCapsules: action.payload.isPublic ? [...state.publicCapsules, action.payload] : state.publicCapsules
      }
    case 'UPDATE_CAPSULE':
      return {
        ...state,
        capsules: state.capsules.map(capsule => 
          capsule.id === action.payload.id ? action.payload : capsule
        ),
        publicCapsules: state.publicCapsules.map(capsule => 
          capsule.id === action.payload.id ? action.payload : capsule
        )
      }
    case 'DELETE_CAPSULE':
      return {
        ...state,
        capsules: state.capsules.filter(capsule => capsule.id !== action.payload),
        publicCapsules: state.publicCapsules.filter(capsule => capsule.id !== action.payload),
        memories: state.memories.filter(capsule => capsule.id !== action.payload)
      }
    case 'SET_CAPSULES':
      return { ...state, capsules: action.payload }
    case 'SET_PUBLIC_CAPSULES':
      // Public capsules feature removed in v4 – ignore updates
      return state
    case 'ADD_TO_MEMORIES':
      return {
        ...state,
        memories: state.memories.some(capsule => capsule.id === action.payload.id) 
          ? state.memories 
          : [...state.memories, action.payload]
      }
    case 'REMOVE_FROM_MEMORIES':
      return {
        ...state,
        memories: state.memories.filter(capsule => capsule.id !== action.payload)
      }
    case 'SET_MEMORIES':
      return { ...state, memories: action.payload }
    case 'IMPORT_DATA':
      return { 
        ...state, 
        capsules: action.payload.capsules || [],
        publicCapsules: action.payload.publicCapsules || [],
        memories: action.payload.memories || []
      }
    default:
      return state
  }
}

export const CapsuleProvider = ({ children }) => {
  const [state, dispatch] = useReducer(capsuleReducer, initialState)

  const normalizeCapsule = (capsule) => {
    const timeReached = new Date() >= new Date(capsule.unlockDate)
    const hasPassword = !!capsule.hasPassword
    const isUnlocked = timeReached && !hasPassword
    const isMulti = !!(capsule.isMultiUser || (capsule.collaborators && capsule.collaborators.length > 0) || capsule.type === 'Multi')
    const media = Array.isArray(capsule.media)
      ? capsule.media.map((m) => ({
          ...m,
          url: m?.url ? normalizeMediaUrl(m.url) : (m?.id ? mediaDownloadUrl(m.id) : m?.url),
        }))
      : capsule.media
    return { ...capsule, media, hasPassword, isUnlocked, isMulti }
  }

  // Load capsules from API on mount
  useEffect(() => {
    const bootstrap = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        // My capsules
        try {
          const my = await api.listMyCapsules()
          const normalized = (my.capsules || []).map(normalizeCapsule)
          dispatch({ type: 'SET_CAPSULES', payload: normalized })
        } catch (e) {
          // ignore if unauthenticated
        }
        // Public capsules loading removed in v4
        // Memories (auth)
        try {
          const mem = await api.listMemories()
          const normalizedMem = (mem.capsules || []).map(normalizeCapsule)
          dispatch({ type: 'SET_MEMORIES', payload: normalizedMem })
        } catch (e) {}
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    bootstrap()
  }, [])

  const addCapsule = async (capsule) => {
    // Create capsule first, then upload media bytes to DB
    const payload = {
      title: capsule.title,
      message: capsule.message,
      unlockDate: capsule.unlockDate,
      type: capsule.type,
      isPublic: false, // public capsules disabled in v4
      emailNotification: capsule.emailNotification || null,
      media: [],
      isMultiUser: !!capsule.isMultiUser,
      collaborators: capsule.collaborators || [],
      hasPassword: !!capsule.hasPassword,
      password: capsule.hasPassword ? capsule.password : undefined
    }
    const res = await api.createCapsule(payload)
    let created = normalizeCapsule(res.capsule)
    dispatch({ type: 'ADD_CAPSULE', payload: created })

    // Upload media files (if any) and attach to created capsule in state
    const mediaItems = Array.isArray(capsule.media) ? capsule.media : []
    const uploaded = []
    for (const item of mediaItems) {
      if (!item?.file) continue
      const up = await api.uploadCapsuleMedia(created.id, item.file)
      if (up?.media) uploaded.push(up.media)
    }
    if (uploaded.length > 0) {
      created = normalizeCapsule({ ...created, media: [...(created.media || []), ...uploaded] })
      dispatch({ type: 'UPDATE_CAPSULE', payload: created })
    }
    // created.isPublic is always false in v4
  }

  const updateCapsule = (id, updates) => {
    const updatedCapsule = { ...updates, id }
    dispatch({ type: 'UPDATE_CAPSULE', payload: updatedCapsule })
  }

  const deleteCapsule = async (id) => {
    await api.deleteCapsule(id)
    dispatch({ type: 'DELETE_CAPSULE', payload: id })
  }

  const addToMemories = async (capsule) => {
    await api.addToMemories(capsule.id)
    dispatch({ type: 'ADD_TO_MEMORIES', payload: capsule })
  }

  const removeFromMemories = async (id) => {
    await api.removeFromMemories(id)
    dispatch({ type: 'REMOVE_FROM_MEMORIES', payload: id })
  }

  const getCapsuleById = (id) => {
    const found = state.capsules.find(capsule => capsule.id === id)
    if (!found) return undefined
    // Derive isUnlocked from time and password protection, do not expose password
    const timeReached = new Date() >= new Date(found.unlockDate)
    const hasPassword = !!found.hasPassword
    const isUnlocked = timeReached ? (hasPassword ? !!found.isUnlocked : true) : false
    return { ...found, hasPassword, isUnlocked }
  }

  const getUpcomingCapsules = () => {
    const now = new Date()
    return state.capsules.filter(capsule => new Date(capsule.unlockDate) > now)
  }

  const getUnlockedCapsules = () => {
    const now = new Date()
    return state.capsules.filter(capsule => new Date(capsule.unlockDate) <= now)
  }

  const getMemories = () => {
    return state.memories
  }

  const isInMemories = (id) => {
    return state.memories.some(capsule => capsule.id === id)
  }

  const importData = (data) => {
    dispatch({ type: 'IMPORT_DATA', payload: data })
  }

  const value = {
    ...state,
    addCapsule,
    updateCapsule,
    deleteCapsule,
    addToMemories,
    removeFromMemories,
    getCapsuleById,
    getUpcomingCapsules,
    getUnlockedCapsules,
    getMemories,
    isInMemories,
    importData
  }

  return (
    <CapsuleContext.Provider value={value}>
      {children}
    </CapsuleContext.Provider>
  )
}

export const useCapsules = () => {
  const context = useContext(CapsuleContext)
  if (!context) {
    throw new Error('useCapsules must be used within a CapsuleProvider')
  }
  return context
} 