import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

const CountdownTimer = ({ unlockDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(unlockDate) - new Date()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [unlockDate])

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ]

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-4 w-4 text-blue-500 dark:text-primary-400" />
      <div className="flex space-x-1">
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="text-center">
            <motion.div
              key={unit.value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 dark:bg-white/10 rounded-lg px-2 py-1 min-w-[2.5rem] border border-gray-200 dark:border-white/20"
            >
              <span className="text-sm font-bold text-gray-800 dark:text-white">
                {unit.value.toString().padStart(2, '0')}
              </span>
            </motion.div>
            <span className="text-xs text-gray-500 dark:text-white/60 block mt-1">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CountdownTimer 