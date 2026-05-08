import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ThemeToggle = ({ className = '', showLabels = false }) => {
  const { theme, setThemeMode } = useTheme()

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' }
  ]

  const getThemeIcon = () => {
    const currentTheme = themes.find(t => t.id === theme)
    return currentTheme ? currentTheme.icon : Sun
  }

  const Icon = getThemeIcon()

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabels ? (
        // Full theme selector with labels
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          {themes.map((themeOption) => {
            const ThemeIcon = themeOption.icon
            const isActive = theme === themeOption.id
            
            return (
              <motion.button
                key={themeOption.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setThemeMode(themeOption.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'theme-nav-link-active bg-primary-500/10 dark:bg-primary-400/10'
                    : 'theme-nav-link hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={`Switch to ${themeOption.label} mode`}
              >
                <ThemeIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{themeOption.label}</span>
              </motion.button>
            )
          })}
        </div>
      ) : (
        // Compact theme toggle
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setThemeMode(theme === 'light' ? 'dark' : 'light')
          }}
          className="theme-btn-ghost rounded-xl p-2"
          title={`Current: ${themes.find(t => t.id === theme)?.label}. Click to toggle.`}
        >
          <Icon className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  )
}

export default ThemeToggle 