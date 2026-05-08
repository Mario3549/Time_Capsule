import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Users, 
  Lock, 
  Heart, 
  Globe, 
  Clock, 
  Calendar,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useCapsules } from '../context/CapsuleContext'
import CountdownTimer from '../components/CountdownTimer'
import AnimatedBackground from '../components/AnimatedBackground'
import ThreeDAnimation from '../components/ThreeDAnimation'
import Logo from '../components/Logo'

const Dashboard = () => {
  const { capsules, getUpcomingCapsules, getUnlockedCapsules, getMemories } = useCapsules()
  
  const upcomingCapsules = getUpcomingCapsules()
  const unlockedCapsules = getUnlockedCapsules()
  const memories = getMemories()

  const stats = [
    {
      title: 'Total Capsules',
      value: capsules.length,
      icon: Lock,
      color: 'from-blue-500 to-blue-600',
      link: '/vault'
    },
    {
      title: 'Upcoming',
      value: upcomingCapsules.length,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      link: '/vault'
    },
    {
      title: 'Unlocked',
      value: unlockedCapsules.length,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      link: '/vault'
    },
    {
      title: 'Memories',
      value: memories.length,
      icon: Heart,
      color: 'from-pink-500 to-pink-600',
      link: '/memories'
    }
  ]

  const quickActions = [
    {
      title: 'Create Capsule',
      description: 'Send a message to your future self',
      icon: Plus,
      color: 'from-primary-500 to-secondary-500',
      link: '/create',
      gradient: 'bg-gradient-to-r from-primary-500 to-secondary-500'
    },
    {
      title: 'Multi-User Capsule',
      description: 'Create a capsule with friends',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      link: '/create-multi',
      gradient: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    {
      title: 'Collaboration Invites',
      description: 'Approve or reject capsule invitations',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      link: '/collaboration/invites',
      gradient: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    }
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

  return (
    <div className="min-h-screen theme-bg relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      <ThreeDAnimation />
      
      <div className="theme-container theme-section relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-header"
        >
          <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            className="text-5xl font-bold theme-text mb-4"
          >
            Welcome to TimeVault
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="theme-text-secondary text-xl max-w-2xl mx-auto"
          >
                            Preserve your memories and send messages to your future self. Create TimeVault capsules that unlock at the perfect moment.
          </motion.p>
          </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="theme-grid mb-12"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="theme-card-hover p-6 relative overflow-hidden"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5
                  }}
                  className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-10 -mt-10"
                />
                <Link to={stat.link} className="block relative z-10">
                  <div className="flex items-center justify-between mb-4">
            <motion.div
                      className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <ArrowRight className="h-5 w-5 theme-text-muted" />
                  </div>
                  <h3 className="text-2xl font-bold theme-text mb-1">{stat.value}</h3>
                  <p className="theme-text-secondary">{stat.title}</p>
              </Link>
            </motion.div>
            )
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="theme-header">
            <h2 className="text-3xl font-bold theme-text mb-4">Quick Actions</h2>
                              <p className="theme-text-secondary">Get started with creating your first TimeVault capsule</p>
          </div>
          
          <div className="theme-grid">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="theme-card-hover overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full -mr-8 -mt-8" />
                  <Link to={action.link} className="block p-6 relative z-10">
                    <div 
                      className={`w-16 h-16 ${action.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold theme-text mb-2">{action.title}</h3>
                    <p className="theme-text-secondary mb-4">{action.description}</p>
                    <div className="flex items-center theme-text-accent font-medium">
                      <span>Get Started</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="theme-header">
            <h2 className="text-3xl font-bold theme-text mb-4">Recent Activity</h2>
                              <p className="theme-text-secondary">Your latest TimeVault capsules and memories</p>
                  </div>
                  
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Capsules */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="theme-card p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-8 -mt-8" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-semibold theme-text">Upcoming Capsules</h3>
                <Link to="/vault" className="theme-text-accent hover:underline">View All</Link>
                  </div>
                  
              {upcomingCapsules.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  {upcomingCapsules.slice(0, 3).map((capsule) => (
                    <motion.div 
                      key={capsule.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div>
                        <h4 className="font-medium theme-text">{capsule.title}</h4>
                        <p className="text-sm theme-text-muted">{capsule.type}</p>
                  </div>
                      <CountdownTimer unlockDate={capsule.unlockDate} />
                </motion.div>
              ))}
            </div>
              ) : (
                <div className="text-center py-8 relative z-10">
                  <Lock className="h-12 w-12 theme-text-muted mx-auto mb-4" />
                  <p className="theme-text-secondary">No upcoming capsules</p>
                  <Link to="/create" className="theme-btn-primary mt-4 inline-block">
                    Create Your First
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Recent Memories */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="theme-card p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-400/10 to-purple-400/10 rounded-full -mr-8 -mt-8" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-semibold theme-text">Recent Memories</h3>
                <Link to="/memories" className="theme-text-accent hover:underline">View All</Link>
              </div>
              
              {memories.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  {memories.slice(0, 3).map((memory) => (
                    <motion.div 
                      key={memory.id} 
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      whileHover={{ scale: 1.02, x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div 
                        className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center"
                      >
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium theme-text">{memory.title}</h4>
                        <p className="text-sm theme-text-muted">
                          Unlocked {new Date(memory.unlockDate).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 relative z-10">
                  <Heart className="h-12 w-12 theme-text-muted mx-auto mb-4" />
                  <p className="theme-text-secondary">No memories yet</p>
                  <p className="text-sm theme-text-muted mt-2">Unlock capsules to create memories</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
        </div>
    </div>
  )
}

export default Dashboard 