import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    // If saved theme is 'auto', default to 'light', otherwise use saved theme or default to 'light'
    if (savedTheme === 'auto') {
      return 'light'
    }
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    // Initialize with the correct theme based on saved preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') return 'dark'
    if (savedTheme === 'light') return 'light'
    // Default to light if no saved preference
    return 'light'
  })

  // Set initial theme class immediately
  useEffect(() => {
    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark')
    
    // Add the appropriate class for Tailwind dark mode
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [resolvedTheme])

  useEffect(() => {
    // Set resolved theme directly (no auto logic)
    setResolvedTheme(theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    
    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark')
    
    // Add the appropriate class for Tailwind dark mode
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [theme, resolvedTheme])

  const toggleTheme = () => {
    setTheme(prev => {
      return prev === 'dark' ? 'light' : 'dark'
    })
  }

  const setThemeMode = (newTheme) => {
    // Only allow 'light' or 'dark'
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      toggleTheme,
      setThemeMode
    }}>
      {children}
    </ThemeContext.Provider>
  )
} 