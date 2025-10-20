/**
 * Accessible Hero Section Component with WCAG AA Compliance
 * Includes semantic HTML, ARIA attributes, keyboard navigation, and i18n support
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Zap, Target, BarChart3, Info } from 'lucide-react';
import { useTranslation } from 'next-i18next';

interface HeroSectionProps {
  className?: string;
  reducedMotion?: boolean;
}

export const HeroSectionAccessible: React.FC<HeroSectionProps> = ({
  className = '',
  reducedMotion: forceReducedMotion = false
}) => {
  const { t } = useTranslation('landing');
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = forceReducedMotion || prefersReducedMotion;

  const [announcementText, setAnnouncementText] = useState('');
  const heroRef = useRef<HTMLElement>(null);
  const [focusVisible, setFocusVisible] = useState(false);

  // Animation variants with reduced motion support
  const fadeInUp = shouldReduceMotion ? undefined : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerChildren = shouldReduceMotion ? undefined : {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Feature data with icons and colors
  const features = [
    {
      id: 'smart-roadmaps',
      icon: Target,
      color: 'blue',
      titleKey: 'features.smartRoadmaps.title',
      descriptionKey: 'features.smartRoadmaps.description',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-500/30',
      hoverBgClass: 'hover:bg-blue-500/20',
      glowClass: 'hover:shadow-glow-blue',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-300'
    },
    {
      id: 'real-time-collab',
      icon: Zap,
      color: 'purple',
      titleKey: 'features.realtimeCollab.title',
      descriptionKey: 'features.realtimeCollab.description',
      bgClass: 'bg-purple-500/10',
      borderClass: 'border-purple-500/30',
      hoverBgClass: 'hover:bg-purple-500/20',
      glowClass: 'hover:shadow-glow-purple',
      iconColor: 'text-purple-400',
      titleColor: 'text-purple-300'
    },
    {
      id: 'analytics-dashboard',
      icon: BarChart3,
      color: 'green',
      titleKey: 'features.analytics.title',
      descriptionKey: 'features.analytics.description',
      bgClass: 'bg-green-500/10',
      borderClass: 'border-green-500/30',
      hoverBgClass: 'hover:bg-green-500/20',
      glowClass: 'hover:shadow-glow-green',
      iconColor: 'text-green-400',
      titleColor: 'text-green-300'
    }
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Handle CTA click with announcement
  const handleCtaClick = (action: string) => {
    setAnnouncementText(t('navigation.navigatingTo', { destination: action }));
  };

  return (
    <section
      ref={heroRef}
      className={`hero-section ${className}`}
      aria-labelledby="hero-heading"
      role="region"
    >
      {/* Screen reader announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="additions"
      >
        {announcementText}
      </div>

      <motion.div
        className="text-center mb-16 px-4"
        {...(shouldReduceMotion ? {} : {
          initial: "initial",
          animate: "animate",
          variants: staggerChildren
        })}
      >
        {/* Main heading with proper hierarchy */}
        <motion.h1
          id="hero-heading"
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-neon-mix bg-clip-text text-transparent leading-tight"
          {...(shouldReduceMotion ? {} : { variants: fadeInUp })}
          lang={t('_locale')}
        >
          {t('hero.title')}
        </motion.h1>

        {/* Supporting description */}
        <motion.p
          className="text-xl text-gray-400 mb-2 max-w-2xl mx-auto leading-relaxed"
          {...(shouldReduceMotion ? {} : { variants: fadeInUp })}
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* Beta notice */}
        <motion.p
          className="text-base text-gray-500 italic mb-8"
          {...(shouldReduceMotion ? {} : { variants: fadeInUp })}
          role="status"
        >
          {t('hero.betaNotice')}
        </motion.p>

        {/* Call-to-action buttons with proper focus states */}
        <motion.nav
          className="flex gap-4 justify-center flex-wrap"
          {...(shouldReduceMotion ? {} : { variants: fadeInUp })}
          role="navigation"
          aria-label={t('hero.ctaNavigation')}
        >
          <Link
            href="/signup"
            className={`
              group bg-gradient-blue hover:shadow-glow-blue text-white
              px-8 py-4 rounded-lg font-semibold text-lg
              inline-flex items-center gap-2 transition-all
              transform hover:scale-105
              focus:outline-none focus:ring-4 focus:ring-blue-500/50
              ${focusVisible ? 'ring-4 ring-blue-500/50' : ''}
              relative
            `}
            onClick={() => handleCtaClick(t('hero.startFreeTrial'))}
            aria-label={t('hero.startFreeTrialDescription')}
          >
            <span>{t('hero.startFreeTrial')}</span>
            <ArrowRight
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
            <span className="sr-only">{t('hero.opensInSamePage')}</span>
          </Link>

          <Link
            href="/test"
            className={`
              bg-transparent hover:bg-white/10 text-blue-400
              px-8 py-4 rounded-lg font-semibold text-lg
              border-2 border-blue-400 inline-block transition-all
              focus:outline-none focus:ring-4 focus:ring-blue-400/50
              ${focusVisible ? 'ring-4 ring-blue-400/50' : ''}
            `}
            onClick={() => handleCtaClick(t('hero.viewDemo'))}
            aria-label={t('hero.viewDemoDescription')}
          >
            {t('hero.viewDemo')}
          </Link>
        </motion.nav>
      </motion.div>

      {/* Features Grid with semantic HTML */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 px-4"
        {...(shouldReduceMotion ? {} : {
          initial: "initial",
          whileInView: "animate",
          viewport: { once: true },
          variants: staggerChildren
        })}
        role="list"
        aria-label={t('features.heading')}
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.article
              key={feature.id}
              className={`
                ${feature.bgClass} ${feature.borderClass}
                rounded-lg p-8 ${feature.hoverBgClass}
                transition-all ${feature.glowClass} group
                focus-within:ring-4 focus-within:ring-${feature.color}-500/50
              `}
              {...(shouldReduceMotion ? {} : {
                variants: fadeInUp,
                whileHover: { scale: 1.02 }
              })}
              role="listitem"
              aria-labelledby={`heading-${feature.id}`}
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setAnnouncementText(t('features.selected', { feature: t(feature.titleKey) }));
                }
              }}
            >
              <header className="flex items-center gap-3 mb-4">
                <Icon
                  className={`w-8 h-8 ${feature.iconColor} group-hover:animate-pulse transition-transform`}
                  aria-hidden="true"
                />
                <h2
                  id={`heading-${feature.id}`}
                  className={`${feature.titleColor} text-xl font-semibold`}
                >
                  {t(feature.titleKey)}
                </h2>
              </header>
              <p className="leading-relaxed text-gray-300">
                {t(feature.descriptionKey)}
              </p>
              {/* Hidden link for screen readers */}
              <Link
                href={`/features/${feature.id}`}
                className="sr-only"
                aria-label={t('features.learnMore', { feature: t(feature.titleKey) })}
              >
                {t('features.learnMore', { feature: t(feature.titleKey) })}
              </Link>
            </motion.article>
          );
        })}
      </motion.div>

      {/* Keyboard navigation help */}
      <button
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all z-50"
        onClick={() => {
          const helpText = t('help.keyboardShortcuts');
          alert(helpText);
          setAnnouncementText(helpText);
        }}
        aria-label={t('help.showKeyboardShortcuts')}
      >
        <Info className="w-5 h-5" aria-hidden="true" />
      </button>
    </section>
  );
};

export default HeroSectionAccessible;