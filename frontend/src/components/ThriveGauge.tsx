import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

interface ThriveGaugeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const ThriveGauge: React.FC<ThriveGaugeProps> = ({ 
  size = 'medium', 
  showLabel = true, 
  className = '' 
}) => {
  const { thriveScore } = useStore();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { radius: 45, strokeWidth: 8, fontSize: 'text-lg', containerSize: 'w-24 h-24' },
    medium: { radius: 60, strokeWidth: 10, fontSize: 'text-xl', containerSize: 'w-32 h-32' },
    large: { radius: 80, strokeWidth: 12, fontSize: 'text-2xl', containerSize: 'w-40 h-40' }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDasharray = `${(animatedScore / 100) * circumference} ${circumference}`;

  // Animate score changes
  useEffect(() => {
    const targetScore = thriveScore * 100;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    const stepValue = (targetScore - animatedScore) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep >= steps) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
        // Trigger glow effect when animation completes
        setIsGlowing(true);
        setTimeout(() => setIsGlowing(false), 1000);
      } else {
        setAnimatedScore(prev => prev + stepValue);
        currentStep++;
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [thriveScore]);

  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--neon-green-primary)';
    if (score >= 60) return 'var(--neon-blue-primary)';
    if (score >= 40) return 'var(--neon-orange)';
    return 'var(--neon-pink)';
  };

  const scoreColor = getScoreColor(animatedScore);

  return (
    <div className={`relative ${config.containerSize} ${className}`}>
      {/* Main Gauge */}
      <motion.div
        className="relative w-full h-full"
        animate={{
          scale: isGlowing ? 1.05 : 1,
          filter: isGlowing 
            ? `drop-shadow(0 0 20px ${scoreColor})` 
            : `drop-shadow(0 0 0px ${scoreColor})`
        }}
        transition={{ duration: 0.5 }}
      >
        <svg 
          className="w-full h-full transform -rotate-90" 
          viewBox={`0 0 ${(config.radius + config.strokeWidth) * 2} ${(config.radius + config.strokeWidth) * 2}`}
        >
          {/* Background circle */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={config.strokeWidth}
            className="opacity-30"
          />
          
          {/* Animated progress circle */}
          <motion.circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray }}
            transition={{ duration: 2, ease: 'easeOut' }}
            style={{ 
              filter: `drop-shadow(0 0 8px ${scoreColor})`,
              transition: 'stroke 0.3s ease, filter 0.3s ease'
            }}
          />
          
          {/* Pulse ring */}
          <AnimatePresence>
            {isGlowing && (
              <motion.circle
                cx={config.radius + config.strokeWidth}
                cy={config.radius + config.strokeWidth}
                r={config.radius + 5}
                fill="none"
                stroke={scoreColor}
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.2, 1.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </svg>

        {/* Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className={`font-bold ${config.fontSize}`}
            style={{ color: scoreColor }}
            animate={{ 
              textShadow: isGlowing ? `0 0 20px ${scoreColor}` : `0 0 10px ${scoreColor}` 
            }}
          >
            {Math.round(animatedScore)}
          </motion.div>
          {showLabel && (
            <motion.div
              className="text-xs text-text-muted mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              THRIVE
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Floating particles for high scores */}
      <AnimatePresence>
        {animatedScore >= 90 && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ backgroundColor: scoreColor }}
                initial={{ 
                  x: config.radius + config.strokeWidth,
                  y: config.radius + config.strokeWidth,
                  opacity: 0 
                }}
                animate={{
                  x: [
                    config.radius + config.strokeWidth,
                    config.radius + config.strokeWidth + Math.random() * 60 - 30
                  ],
                  y: [
                    config.radius + config.strokeWidth,
                    config.radius + config.strokeWidth + Math.random() * 60 - 30
                  ],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Achievement indicator for perfect scores */}
      <AnimatePresence>
        {animatedScore === 100 && (
          <motion.div
            className="absolute -top-2 -right-2 text-xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            ⭐
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThriveGauge;