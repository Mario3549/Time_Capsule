import React from 'react'
import { motion } from 'framer-motion'

const Logo = ({ size = 'default', showText = true, className = '' }) => {
  const sizes = {
    small: 'h-6 w-6',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  const textSizes = {
    small: 'text-lg',
    default: 'text-xl',
    large: 'text-2xl'
  }

  return (
    <motion.div 
      className={`flex items-center space-x-2 ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Logo Icon */}
      <div className={`${sizes[size]} relative`}>
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Main circle */}
          <circle cx="60" cy="60" r="58" fill="url(#logoGradient)" stroke="url(#innerGradient)" strokeWidth="2"/>
          
          {/* Vault door outline */}
          <rect x="35" y="25" width="50" height="70" rx="8" fill="none" stroke="white" strokeWidth="3" opacity="0.9"/>
          
          {/* Vault door inner frame */}
          <rect x="40" y="30" width="40" height="60" rx="4" fill="none" stroke="white" strokeWidth="2" opacity="0.7"/>
          
          {/* Vault door handle */}
          <circle cx="60" cy="60" r="8" fill="url(#accentGradient)" stroke="white" strokeWidth="2"/>
          <circle cx="60" cy="60" r="4" fill="white"/>
          
          {/* Clock face inside vault */}
          <circle cx="60" cy="60" r="15" fill="none" stroke="white" strokeWidth="2" opacity="0.8"/>
          
          {/* Clock hands */}
          <line x1="60" y1="60" x2="60" y2="48" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="60" y1="60" x2="68" y2="60" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          
          {/* Center dot */}
          <circle cx="60" cy="60" r="2" fill="white"/>
          
          {/* Hour markers */}
          <line x1="60" y1="47" x2="60" y2="50" stroke="white" strokeWidth="1" opacity="0.6"/>
          <line x1="60" y1="70" x2="60" y2="73" stroke="white" strokeWidth="1" opacity="0.6"/>
          <line x1="47" y1="60" x2="50" y2="60" stroke="white" strokeWidth="1" opacity="0.6"/>
          <line x1="70" y1="60" x2="73" y2="60" stroke="white" strokeWidth="1" opacity="0.6"/>
          
          {/* Lock mechanism */}
          <rect x="55" y="20" width="10" height="8" rx="2" fill="url(#accentGradient)" stroke="white" strokeWidth="1"/>
          <circle cx="60" cy="24" r="2" fill="white"/>
          
          {/* Time capsule representation */}
          <circle cx="25" cy="25" r="6" fill="white" opacity="0.9"/>
          <circle cx="95" cy="95" r="6" fill="white" opacity="0.9"/>
          <line x1="31" y1="31" x2="89" y2="89" stroke="white" strokeWidth="2" opacity="0.7" strokeLinecap="round"/>
          
          {/* Sparkle effects */}
          <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.8"/>
          <circle cx="100" cy="100" r="1.5" fill="white" opacity="0.8"/>
          <circle cx="20" cy="100" r="1" fill="white" opacity="0.6"/>
          <circle cx="100" cy="20" r="1" fill="white" opacity="0.6"/>
          
          {/* Glow effect */}
          <circle cx="60" cy="60" r="65" fill="none" stroke="url(#innerGradient)" strokeWidth="1" opacity="0.3"/>
        </svg>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <motion.span 
          className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${textSizes[size]}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          TimeVault
        </motion.span>
      )}
    </motion.div>
  )
}

export default Logo
