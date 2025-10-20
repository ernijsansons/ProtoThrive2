import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Spline } from '@splinetool/react-spline';
import { ScreenReaderAnnouncer } from '../utils/accessibility';

interface Spline3DAccessibilityProps {
  scene: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  // Accessibility props
  ariaLabel?: string;
  ariaDescription?: string;
  enableKeyboardNavigation?: boolean;
  enableScreenReaderSupport?: boolean;
}

/**
 * Accessibility-enhanced 3D Spline component with screen reader support
 */
export const Spline3DAccessibility: React.FC<Spline3DAccessibilityProps> = ({
  scene,
  onLoad,
  onError,
  className = '',
  style = {},
  ariaLabel = 'Interactive 3D scene',
  ariaDescription = 'Use mouse or touch to interact with this 3D environment',
  enableKeyboardNavigation = true,
  enableScreenReaderSupport = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [currentView, setCurrentView] = useState('default');
  const [interactionCount, setInteractionCount] = useState(0);
  const splineRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionTime = useRef<number>(0);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    if (enableScreenReaderSupport) {
      ScreenReaderAnnouncer.announce(message);
    }
  }, [enableScreenReaderSupport]);

  // Handle 3D scene load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    announceToScreenReader('3D scene loaded successfully. You can now interact with the 3D environment.');
    onLoad?.();
  }, [onLoad, announceToScreenReader]);

  // Handle 3D scene errors
  const handleError = useCallback((error: Error) => {
    console.error('3D scene error:', error);
    announceToScreenReader('3D scene failed to load. Falling back to 2D view.');
    onError?.(error);
  }, [onError, announceToScreenReader]);

  // Track user interactions
  const handleInteraction = useCallback((type: 'mouse' | 'touch' | 'keyboard') => {
    const now = Date.now();
    if (now - lastInteractionTime.current > 1000) { // Throttle announcements
      setInteractionCount(prev => prev + 1);
      lastInteractionTime.current = now;
      
      const interactionMessages = {
        mouse: 'Mouse interaction detected in 3D scene',
        touch: 'Touch interaction detected in 3D scene',
        keyboard: 'Keyboard navigation active in 3D scene'
      };
      
      announceToScreenReader(interactionMessages[type]);
    }
  }, [announceToScreenReader]);

  // Keyboard navigation for 3D scene
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation || !isLoaded) return;

    const { key, ctrlKey, metaKey } = event;
    
    // Prevent default for our custom navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(key)) {
      event.preventDefault();
    }

    switch (key) {
      case 'ArrowUp':
        announceToScreenReader('Rotating 3D scene up');
        setCurrentView('rotated up');
        break;
      case 'ArrowDown':
        announceToScreenReader('Rotating 3D scene down');
        setCurrentView('rotated down');
        break;
      case 'ArrowLeft':
        announceToScreenReader('Rotating 3D scene left');
        setCurrentView('rotated left');
        break;
      case 'ArrowRight':
        announceToScreenReader('Rotating 3D scene right');
        setCurrentView('rotated right');
        break;
      case ' ':
      case 'Enter':
        announceToScreenReader('Resetting 3D scene to default view');
        setCurrentView('default');
        break;
      case 'h':
        if (ctrlKey || metaKey) {
          event.preventDefault();
          announceToScreenReader(
            '3D Scene Help: Arrow keys to rotate, Space/Enter to reset view, ' +
            'Mouse drag to rotate, Scroll to zoom, Right-click to pan'
          );
        }
        break;
      case 'i':
        if (ctrlKey || metaKey) {
          event.preventDefault();
          announceToScreenReader(
            `3D Scene Info: ${isLoaded ? 'Loaded' : 'Loading'}, ` +
            `Interactions: ${interactionCount}, Current view: ${currentView}`
          );
        }
        break;
    }
  }, [enableKeyboardNavigation, isLoaded, announceToScreenReader, interactionCount, currentView]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse events
    const handleMouseDown = () => {
      setIsInteracting(true);
      handleInteraction('mouse');
    };
    
    const handleMouseUp = () => {
      setIsInteracting(false);
    };

    // Touch events
    const handleTouchStart = () => {
      setIsInteracting(true);
      handleInteraction('touch');
    };
    
    const handleTouchEnd = () => {
      setIsInteracting(false);
    };

    // Keyboard events
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleKeyDown, handleInteraction]);

  // Focus management
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Make container focusable for keyboard navigation
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'application');
    container.setAttribute('aria-label', ariaLabel);
    
    if (ariaDescription) {
      container.setAttribute('aria-describedby', 'spline-description');
    }

    return () => {
      container.removeAttribute('tabindex');
      container.removeAttribute('role');
      container.removeAttribute('aria-label');
      container.removeAttribute('aria-describedby');
    };
  }, [ariaLabel, ariaDescription]);

  return (
    <div
      ref={containerRef}
      className={`spline-3d-accessibility ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        outline: 'none',
        ...style
      }}
      role="application"
      aria-label={ariaLabel}
      aria-describedby={ariaDescription ? 'spline-description' : undefined}
      tabIndex={0}
    >
      {/* Screen reader description */}
      {ariaDescription && (
        <div
          id="spline-description"
          className="sr-only"
          aria-live="polite"
        >
          {ariaDescription}
        </div>
      )}

      {/* Loading state announcement */}
      {!isLoaded && (
        <div
          className="sr-only"
          aria-live="assertive"
        >
          Loading 3D scene, please wait...
        </div>
      )}

      {/* Interaction state indicator */}
      {isInteracting && (
        <div
          className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded text-sm z-50"
          role="status"
          aria-live="polite"
        >
          🎮 Interacting with 3D scene
        </div>
      )}

      {/* Keyboard mode indicator */}
      {enableKeyboardNavigation && (
        <div
          className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded text-sm z-50"
          role="status"
          aria-live="polite"
        >
          ⌨️ Keyboard navigation enabled
        </div>
      )}

      {/* 3D Scene */}
      <Spline
        ref={splineRef}
        scene={scene}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />

      {/* Accessibility overlay for screen readers */}
      {enableScreenReaderSupport && (
        <div className="sr-only">
          <div aria-live="polite" id="spline-announcements" />
          <div aria-live="assertive" id="spline-alerts" />
        </div>
      )}

      {/* Fallback content for when 3D fails */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-lg font-semibold mb-2">Loading 3D Scene</p>
            <p className="text-sm text-gray-300">
              Please wait while the 3D environment loads...
            </p>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 left-4">
        <button
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          onClick={() => {
            const shortcuts = [
              '3D Scene Keyboard Shortcuts:',
              '• Arrow Keys: Rotate view',
              '• Space/Enter: Reset to default view',
              '• Ctrl+H: Show this help',
              '• Ctrl+I: Show scene information',
              '• Mouse: Drag to rotate, scroll to zoom',
              '• Touch: Drag to rotate, pinch to zoom'
            ].join('\n');
            
            announceToScreenReader(shortcuts);
            alert(shortcuts);
          }}
          aria-label="Show 3D scene keyboard shortcuts help"
        >
          🎮 3D Help
        </button>
      </div>

      {/* Scene information panel */}
      <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg text-white text-sm">
        <div className="mb-2">
          <span className="font-semibold">3D Scene Status:</span>
        </div>
        <ul className="space-y-1 text-xs">
          <li>• Loaded: {isLoaded ? '✅' : '⏳'}</li>
          <li>• Interactions: {interactionCount}</li>
          <li>• Current View: {currentView}</li>
          <li>• Keyboard Nav: {enableKeyboardNavigation ? '✅' : '❌'}</li>
          <li>• Screen Reader: {enableScreenReaderSupport ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
};

export default Spline3DAccessibility;
