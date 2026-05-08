import React from 'react'

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Light Focus Spot 1 - Upper Right (more visible) */}
      <div 
        className="absolute top-0 right-0"
        style={{
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.5) 0%, rgba(88, 28, 135, 0.3) 30%, rgba(88, 28, 135, 0.15) 50%, transparent 70%)',
          filter: 'blur(80px)',
          transform: 'translate(15%, -15%)'
        }}
      />
      
      {/* Light Focus Spot 2 - Lower Left (more visible) */}
      <div 
        className="absolute bottom-0 left-0"
        style={{
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.45) 0%, rgba(30, 58, 138, 0.25) 30%, rgba(30, 58, 138, 0.12) 50%, transparent 70%)',
          filter: 'blur(70px)',
          transform: 'translate(-10%, 10%)'
        }}
      />
      
      {/* Light Focus Spot 3 - Center Top (subtle) */}
      <div 
        className="absolute top-0 left-1/2"
        style={{
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3) 0%, rgba(88, 28, 135, 0.2) 30%, rgba(88, 28, 135, 0.1) 50%, transparent 70%)',
          filter: 'blur(75px)',
          transform: 'translate(-50%, -25%)'
        }}
      />
    </div>
  )
}

export default AnimatedBackground
