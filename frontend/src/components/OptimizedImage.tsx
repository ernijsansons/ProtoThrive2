import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  // Custom props
  fallbackSrc?: string;
  lazy?: boolean;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Optimized image component with lazy loading, error handling, and performance optimizations
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  style = {},
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.png',
  lazy = true,
  aspectRatio,
  objectFit = 'cover'
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback image if available
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setIsLoading(true);
    } else {
      onError?.();
    }
  }, [fallbackSrc, imageSrc, onError]);

  // Generate blur placeholder
  const generateBlurDataURL = (width: number, height: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient blur
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#374151');
      gradient.addColorStop(1, '#1f2937');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL();
  };

  // Don't render until in view (for lazy loading)
  if (lazy && !isInView) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-700 animate-pulse ${className}`}
        style={{
          width: width || '100%',
          height: height || '200px',
          aspectRatio,
          ...style
        }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  // Error state
  if (hasError && imageSrc === fallbackSrc) {
    return (
      <div
        className={`bg-gray-800 flex items-center justify-center text-gray-400 ${className}`}
        style={{
          width: width || '100%',
          height: height || '200px',
          aspectRatio,
          ...style
        }}
        role="img"
        aria-label={`Failed to load ${alt}`}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">Image unavailable</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`relative ${className}`} style={style}>
        <div
          className="absolute inset-0 bg-gray-700 animate-pulse"
          style={{ aspectRatio }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Main image component
  const imageProps = {
    src: imageSrc,
    alt,
    quality,
    priority,
    placeholder,
    blurDataURL: blurDataURL || generateBlurDataURL(width || 400, height || 300),
    onLoad: handleLoad,
    onError: handleError,
    style: {
      objectFit,
      ...style
    }
  };

  if (fill) {
    return (
      <div
        className={`relative ${className}`}
        style={{ aspectRatio, ...style }}
      >
        <Image
          {...imageProps}
          fill
          sizes={sizes || '100vw'}
        />
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      width={width || 400}
      height={height || 300}
      sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      className={className}
    />
  );
};

// Responsive image component with multiple sources
interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'src'> {
  sources: {
    src: string;
    media: string;
    width: number;
    height: number;
  }[];
  defaultSrc: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  sources,
  defaultSrc,
  alt,
  className = '',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(defaultSrc);
  const [currentWidth, setCurrentWidth] = useState(400);
  const [currentHeight, setCurrentHeight] = useState(300);

  // Match media queries to determine current source
  useEffect(() => {
    const updateSource = () => {
      const matchingSource = sources.find(source => {
        return window.matchMedia(source.media).matches;
      });

      if (matchingSource) {
        setCurrentSrc(matchingSource.src);
        setCurrentWidth(matchingSource.width);
        setCurrentHeight(matchingSource.height);
      } else {
        setCurrentSrc(defaultSrc);
        setCurrentWidth(400);
        setCurrentHeight(300);
      }
    };

    updateSource();
    window.addEventListener('resize', updateSource);
    return () => window.removeEventListener('resize', updateSource);
  }, [sources, defaultSrc]);

  return (
    <OptimizedImage
      src={currentSrc}
      alt={alt}
      width={currentWidth}
      height={currentHeight}
      className={className}
      {...props}
    />
  );
};

// Image gallery component with lazy loading
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
  }>;
  className?: string;
  columns?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = '',
  columns = 3
}) => {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          lazy={index > 2} // Only lazy load images after the first 3
          className="rounded-lg"
          objectFit="cover"
        />
      ))}
    </div>
  );
};

// Avatar component with fallback
interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 40,
  className = '',
  fallbackText
}) => {
  const [showFallback, setShowFallback] = useState(!src);

  const handleError = () => {
    setShowFallback(true);
  };

  if (showFallback || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%'
        }}
        role="img"
        aria-label={alt}
      >
        {fallbackText || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      objectFit="cover"
      onError={handleError}
      fallbackSrc=""
    />
  );
};

export default OptimizedImage;
