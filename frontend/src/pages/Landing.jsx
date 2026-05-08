import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Lock, 
  Calendar, 
  Users, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Image,
  FileText,
  Video,
  Music,
  Heart,
  Star,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  Mail
} from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const FloatingMemory = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0.6, 1, 0.6], 
      y: [-8, 8, -8],
      scale: [1, 1.05, 1]
    }}
    transition={{ 
      duration: 4 + delay, 
      repeat: Infinity, 
      ease: 'easeInOut',
      delay 
    }}
    className={className}
  >
    {children}
  </motion.div>
)

const TimeCapsuleVisual = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main capsule - simple elegant design */}
      <motion.div
        animate={{ 
          y: [-8, 8, -8],
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
        className="relative"
      >
        {/* Main capsule body - larger size */}
        <div className="relative w-[400px] h-[520px] lg:w-[450px] lg:h-[580px]">
          {/* Outer container with reduced opacity */}
          <div className="absolute inset-0 rounded-[40px] bg-gradient-to-b from-white/85 via-white/80 to-slate-50/85 shadow-2xl border border-slate-200/40 dark:from-slate-800/80 dark:via-slate-800/75 dark:to-slate-900/80 dark:border-slate-700/40 backdrop-blur-sm">
            {/* Content area */}
            <div className="p-10 lg:p-12 h-full flex flex-col">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-primary-500/90 to-purple-500/90 mb-5 shadow-lg">
                  <Lock className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Time Capsule
                </h3>
                <p className="text-sm text-slate-500/90 dark:text-slate-400/90">
                  Your memories are safe
                </p>
              </div>

              {/* Memory preview grid */}
              <div className="grid grid-cols-2 gap-4 mb-8 flex-1">
                {[
                  { icon: Image, label: 'Photos', bg: 'bg-blue-50/80 dark:bg-blue-950/25', iconColor: 'text-blue-500' },
                  { icon: Mail, label: 'Letters', bg: 'bg-amber-50/80 dark:bg-amber-950/25', iconColor: 'text-amber-500' },
                  { icon: FileText, label: 'Notes', bg: 'bg-violet-50/80 dark:bg-violet-950/25', iconColor: 'text-violet-500' },
                  { icon: Video, label: 'Videos', bg: 'bg-emerald-50/80 dark:bg-emerald-950/25', iconColor: 'text-emerald-500' },
                ].map((mem, idx) => {
                  const Icon = mem.icon
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`rounded-xl ${mem.bg} p-5 lg:p-6 flex flex-col items-center justify-center border border-slate-200/40 dark:border-slate-700/40 backdrop-blur-sm`}
                    >
                      <Icon className={`h-7 w-7 lg:h-8 lg:w-8 mb-2 ${mem.iconColor}`} />
                      <span className="text-sm font-semibold text-slate-700/90 dark:text-slate-300/90">
                        {mem.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>

              {/* Footer status */}
              <div className="flex items-center justify-center gap-2 pt-5 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/90 animate-pulse" />
                <span className="text-sm font-medium text-slate-600/90 dark:text-slate-400/90">
                  Secured & Locked
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 dark:from-primary-400/10 dark:to-purple-400/10" />
    <div className="relative">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 dark:from-primary-400/20 dark:to-purple-400/20">
        <Icon className="h-7 w-7 text-primary-600 dark:text-primary-300" />
      </div>
      <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </div>
  </motion.div>
)

const Landing = () => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Background gradients */}
      <div 
        className={`fixed inset-0 -z-10 transition-all duration-700 ${
          isDark 
            ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950' 
            : 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50'
        }`}
      />
      
      {/* Light theme: soft sky gradient overlay */}
      {!isDark && (
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.6),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.4),transparent_50%)]" />
      )}
      
      {/* Dark theme: subtle stars */}
      {isDark && (
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(255,255,255,0.06),transparent_40%)]" />
      )}
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/20 backdrop-blur-md dark:border-slate-700/30 dark:bg-slate-950/30 dark:backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Logo size="default" />
          
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-200 md:flex">
              <a href="#home" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Home
              </a>
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                About
              </a>
            </div>
            
            <ThemeToggle />
            
            <Link
              to="/login"
              className="hidden rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white md:block"
            >
              Login
            </Link>
            
            <Link
              to="/signup"
              className="rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:shadow-xl hover:shadow-primary-500/40"
            >
              Create Capsule
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative px-6 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
            {/* Left: Text Content */}
          <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-8"
          >
            {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-700 dark:border-primary-400/30 dark:bg-primary-400/15 dark:text-primary-200"
              >
                <ShieldCheck className="h-4 w-4" />
                Private, timelocked memory vault
              </motion.div>
              
              {/* Headline */}
              <h1 className="text-5xl font-bold leading-tight text-slate-900 dark:text-white lg:text-6xl xl:text-7xl">
                Capture Today,
                <br />
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
                  Unlock Tomorrow
                </span>
              </h1>

              {/* Subtext */}
              <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Create a digital time capsule filled with photos, letters, and notes—then unlock it on the date you choose. Built with a calm, cinematic feel for emotional storytelling.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:shadow-xl hover:shadow-primary-500/40"
              >
                  Create Your Capsule
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              
                <a
                  href="#features"
                  className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-6 py-4 text-base font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  Learn More
                  <ChevronDown className="h-5 w-5" />
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { label: 'Privacy', value: 'Zero-knowledge' },
                  { label: 'Timelock', value: 'Unlock by date' },
                  { label: 'Sharing', value: 'Invite trusted' },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Capsule Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="flex items-center justify-center lg:justify-end min-h-[500px] lg:min-h-[600px]"
            >
              <TimeCapsuleVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative px-6 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">
              Features
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white lg:text-5xl">
              Premium, calm, and secure
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Light & dark themes, glassmorphism accents, and cinematic depth. Designed for desktop (16:9) with a story-first layout.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={Lock}
              title="Lock Your Memories"
              description="Keep photos, notes, voice memos, and letters in a private vault with a premium calm aesthetic."
              delay={0.1}
            />
            <FeatureCard
              icon={Calendar}
              title="Set Unlock Date"
              description="Choose the future date your capsule opens — milestones, anniversaries, or personal goals."
              delay={0.2}
            />
            <FeatureCard
              icon={Users}
              title="Private Sharing"
              description="Invite trusted friends or family to collaborate and leave messages while staying private by default."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">
              Simple Process
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white lg:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Create your first time capsule in just three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Create Your Capsule',
                description: 'Write your message, upload photos, videos, or audio files. Customize your capsule with a title and choose when it should unlock.',
                icon: FileText,
                color: 'from-blue-500 to-cyan-500',
              },
              {
                step: '02',
                title: 'Lock & Secure',
                description: 'Your capsule is encrypted and securely stored. Set a future unlock date and watch the countdown timer in real-time.',
                icon: Lock,
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '03',
                title: 'Unlock & Relive',
                description: 'On the special date, your capsule automatically unlocks. Relive your memories, share them with others, or keep them private.',
                icon: Sparkles,
                color: 'from-amber-500 to-orange-500',
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_25px_70px_rgba(0,0,0,0.45)]">
                  <div className="absolute right-4 top-4 text-7xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent opacity-10">
                    {step.step}
                  </div>
                  <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {step.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Types Section */}
      <section className="relative px-6 py-20 lg:py-32 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent dark:via-primary-500/10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">
              Rich Media Support
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white lg:text-5xl">
              All Your Memories in One Place
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Add any type of content to make your time capsule truly special
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: Image, label: 'Photos', color: 'from-blue-500 to-cyan-500', desc: 'High-quality images' },
              { icon: Video, label: 'Videos', color: 'from-purple-500 to-pink-500', desc: 'Memorable moments' },
              { icon: Music, label: 'Audio', color: 'from-pink-500 to-rose-500', desc: 'Voice recordings' },
              { icon: FileText, label: 'Text', color: 'from-indigo-500 to-purple-500', desc: 'Letters & notes' }
            ].map((media, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
              >
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${media.color} mx-auto shadow-lg`}>
                  <media.icon className="h-8 w-8 text-white" />
                </div>
                <div className="font-bold text-slate-900 dark:text-white mb-1">{media.label}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">{media.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">
              Trusted by Thousands
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white lg:text-5xl">
              Join Our Growing Community
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { number: '10K+', label: 'Active Users', icon: Users, color: 'from-blue-500 to-cyan-500' },
              { number: '50K+', label: 'Capsules Created', icon: Lock, color: 'from-purple-500 to-pink-500' },
              { number: '1M+', label: 'Memories Preserved', icon: Heart, color: 'from-pink-500 to-rose-500' },
              { number: '99%', label: 'Satisfaction Rate', icon: Star, color: 'from-amber-500 to-orange-500' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} mx-auto shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.number}
                </div>
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative px-6 py-20 lg:py-32 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent dark:via-purple-500/10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">
              Why Choose Us
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white lg:text-5xl">
              Everything You Need
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              All the features you need to preserve and share your most important moments
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              'Create unlimited time capsules',
              'Support for all media types',
              'Collaborate with friends & family',
              'Secure cloud storage',
              'Beautiful, intuitive interface',
              'Free forever - no hidden costs',
              'Real-time countdown timers',
              'Private by default',
              'Cross-platform access'
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                <span className="font-medium text-slate-900 dark:text-white">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="relative px-6 py-20 lg:py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-12 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_45px_120px_rgba(0,0,0,0.45)] lg:p-16"
          >
            {/* Background gradients */}
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary-400/30 via-purple-400/25 to-amber-400/25 blur-3xl dark:from-primary-500/20 dark:via-purple-500/15 dark:to-amber-500/15" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/25 via-primary-300/25 to-purple-400/20 blur-3xl dark:from-amber-400/15 dark:via-primary-400/15 dark:to-purple-400/15" />

            <div className="relative space-y-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">
                Your future self is waiting
              </p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white lg:text-4xl">
                Write to tomorrow, seal it today.
                  </h3>
              <p className="max-w-2xl text-lg leading-7 text-slate-600 dark:text-slate-300">
                Save photos, letters, and promises. Lock them with intention. Unlock when the moment arrives — cinematic, private, and yours.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  to="/signup"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:shadow-xl hover:shadow-primary-500/40"
                >
                  Create Your Capsule
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <a
                  href="#features"
                  className="rounded-xl border border-slate-200/80 bg-white/80 px-6 py-4 text-base font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  Explore Features
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-white/20 px-6 py-8 backdrop-blur-md dark:border-slate-700/30 dark:bg-slate-950/30 dark:backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="small" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              © {new Date().getFullYear()} Time Capsule
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            Privacy-first • Light & Dark themes
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
