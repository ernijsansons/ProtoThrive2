import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRightIcon, PlayIcon, CheckIcon, StarIcon, RocketLaunchIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

const LandingRebuilt: React.FC = () => {
  const router = useRouter();
  const { colors, isEliteMode } = useTheme();

  const handleGetStarted = () => {
    router.push('/signup');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  const features = [
    {
      icon: <RocketLaunchIcon className="w-8 h-8" />,
      title: "AI-Powered Roadmaps",
      description: "Generate intelligent project roadmaps with AI that adapts to your goals and constraints.",
      color: "blue"
    },
    {
      icon: <BoltIcon className="w-8 h-8" />,
      title: "Real-Time Collaboration",
      description: "Work together seamlessly with live updates, comments, and synchronized editing.",
      color: "green"
    },
    {
      icon: <SparklesIcon className="w-8 h-8" />,
      title: "Smart Analytics",
      description: "Get insights into project progress, team performance, and bottleneck identification.",
      color: "purple"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.bgPrimary}, ${colors.bgSecondary})`,
      color: colors.textPrimary,
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 20% 20%, ${colors.neonBluePrimary}20 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${colors.neonPurple}20 0%, transparent 50%)`,
        filter: 'blur(100px)',
        zIndex: 0
      }} />

      {/* Animated Particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              background: colors.neonBluePrimary,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <motion.nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: colors.bgGlass,
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${colors.borderSecondary}`,
          zIndex: 50,
          padding: '0 2rem'
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '4rem'
        }}>
          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            whileHover={{ scale: 1.05 }}
          >
            <div style={{
              width: '2rem',
              height: '2rem',
              background: `linear-gradient(135deg, ${colors.neonBluePrimary}, ${colors.neonPurple})`,
              borderRadius: '0.5rem',
              boxShadow: `0 0 20px ${colors.neonBluePrimary}40`
            }} />
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${colors.neonBluePrimary}, ${colors.neonPurple})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              ProtoThrive
            </span>
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <button className="bg-transparent border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/10" onClick={() => router.push('#features')}>
              Features
            </button>
            <button className="bg-transparent border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/10" onClick={() => router.push('#pricing')}>
              Pricing
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700" onClick={handleSignIn}>
              Sign In
            </button>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section style={{
        paddingTop: '8rem',
        paddingBottom: '6rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <motion.div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2rem'
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: colors.bgGlass,
              backdropFilter: 'blur(8px)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              border: `1px solid ${colors.borderSecondary}`,
              marginBottom: '2rem'
            }}>
              <SparklesIcon className="w-4 h-4" style={{ color: colors.neonBluePrimary }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                🚀 Now with AI-powered roadmaps
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: '900',
              lineHeight: '1.1',
              background: `linear-gradient(135deg, ${colors.textPrimary}, ${colors.neonBluePrimary}, ${colors.neonPurple})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '1.5rem',
              maxWidth: '60rem'
            }}
          >
            Build the Future with
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${colors.neonBluePrimary}, ${colors.neonGreenPrimary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              Elite Roadmaps
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            style={{
              fontSize: '1.25rem',
              lineHeight: '1.6',
              color: colors.textSecondary,
              maxWidth: '42rem',
              marginBottom: '3rem'
            }}
          >
            Transform your ideas into actionable plans with AI-powered roadmapping,
            real-time collaboration, and intelligent project insights.
            Be part of the exclusive beta program shaping the future of project management.
          </motion.p>

          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <button
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
              onClick={handleGetStarted}
            >
              <RocketLaunchIcon className="w-5 h-5" />
              Start Your Journey
            </button>
            <button
              className="bg-transparent border border-white/20 text-white px-8 py-4 rounded-lg hover:bg-white/10 flex items-center gap-2"
            >
              <PlayIcon className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>

          {/* Beta Disclaimer - Required for compliance */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '1.5rem',
              fontSize: '0.75rem',
              color: colors.textMuted,
              textAlign: 'center',
              opacity: 0.8
            }}
          >
            *Beta software - features and pricing subject to change.{' '}
            <a href="/terms" style={{ color: colors.bgPrimary, textDecoration: 'underline' }}>
              Terms apply
            </a>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              marginTop: '3rem',
              fontSize: '0.875rem',
              color: colors.textMuted
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckIcon className="w-4 h-4" style={{ color: colors.neonGreenPrimary }} />
              Free 14-day trial
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckIcon className="w-4 h-4" style={{ color: colors.neonGreenPrimary }} />
              No credit card required
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckIcon className="w-4 h-4" style={{ color: colors.neonGreenPrimary }} />
              Cancel anytime
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        paddingTop: '6rem',
        paddingBottom: '6rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <motion.div
          style={{
            maxWidth: '80rem',
            margin: '0 auto'
          }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div
            variants={itemVariants}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${colors.textPrimary}, ${colors.neonBluePrimary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '1rem'
            }}>
              Elite Features
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: colors.textSecondary,
              maxWidth: '32rem',
              margin: '0 auto'
            }}>
              Everything you need to build exceptional roadmaps and drive your projects to success.
            </p>
          </motion.div>

          <motion.div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
              gap: '2rem'
            }}
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <div
                  className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 h-full"
                  style={{ height: '100%' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '4rem',
                      height: '4rem',
                      borderRadius: '1rem',
                      background: `linear-gradient(135deg, ${colors.neonBluePrimary}20, ${colors.neonPurple}20)`,
                      border: `1px solid ${colors.neonBluePrimary}40`,
                      marginBottom: '1.5rem',
                      color: colors.neonBluePrimary
                    }}>
                      {feature.icon}
                    </div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: colors.textPrimary,
                      marginBottom: '1rem'
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      color: colors.textSecondary,
                      lineHeight: '1.6'
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section style={{
        paddingTop: '6rem',
        paddingBottom: '6rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <motion.div
          style={{
            maxWidth: '80rem',
            margin: '0 auto'
          }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-12"
            style={{ textAlign: 'center' }}
          >
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${colors.textPrimary}, ${colors.neonBluePrimary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '1rem'
            }}>
              Ready to Transform Your Projects?
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: colors.textSecondary,
              marginBottom: '2rem',
              maxWidth: '32rem',
              margin: '0 auto 2rem'
            }}>
              Join the elite tier of project managers and start building roadmaps that actually work.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                onClick={handleGetStarted}
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Start Free Trial
              </button>
              <button
                className="bg-gray-600 text-white px-8 py-4 rounded-lg hover:bg-gray-700"
                onClick={() => router.push('/demo')}
              >
                Book a Demo
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${colors.borderSecondary}`,
        paddingTop: '3rem',
        paddingBottom: '3rem',
        paddingLeft: '2rem',
        paddingRight: '2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              background: `linear-gradient(135deg, ${colors.neonBluePrimary}, ${colors.neonPurple})`,
              borderRadius: '0.375rem'
            }} />
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${colors.neonBluePrimary}, ${colors.neonPurple})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}>
              ProtoThrive
            </span>
          </div>
          <p style={{
            color: colors.textMuted,
            fontSize: '0.875rem'
          }}>
            © 2024 ProtoThrive. All rights reserved. Building the future, one roadmap at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingRebuilt;

console.log('Thermonuclear: Elite Landing Page loaded with complete neon redesign');