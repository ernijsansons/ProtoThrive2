import * as React from 'react';
import { motion } from 'framer-motion';

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <div className="animate-pulse bg-gray-800 rounded-lg h-32" />,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      ) : (
        fallback
      )}
    </div>
  );
};

export default LazyComponent;
