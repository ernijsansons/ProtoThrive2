// Ref: CLAUDE.md - Enhanced Button Component with accessibility and modern patterns
import * as React from 'react';
import { cn } from '../../lib/utils';

// Performance optimization: Pre-computed style constants
const BASE_STYLES = [
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
  'active:scale-[0.98] transform-gpu',
  'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed'
].join(' ');


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | 'default' 
    | 'destructive' 
    | 'outline' 
    | 'secondary' 
    | 'ghost' 
    | 'link'
    | 'neon'
    | 'success'
    | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.memo(React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    loading = false,
    disabled,
    children,
    leftIcon,
    rightIcon,
    fullWidth = false,
    type = 'button',
    ...props 
  }, ref) => {
    const baseStyles = React.useMemo(() => [
      BASE_STYLES,
      fullWidth && 'w-full'
    ].filter(Boolean).join(' '), [fullWidth]);
    
    const variants = {
      default: [
        'bg-primary-600 text-white shadow-soft',
        'hover:bg-primary-700 hover:shadow-medium',
        'focus-visible:ring-primary-500',
        'dark:bg-primary-500 dark:hover:bg-primary-600'
      ].join(' '),
      
      destructive: [
        'bg-error-600 text-white shadow-soft',
        'hover:bg-error-700 hover:shadow-medium',
        'focus-visible:ring-error-500',
        'dark:bg-error-500 dark:hover:bg-error-600'
      ].join(' '),
      
      outline: [
        'border-2 border-gray-300 bg-transparent text-gray-700 shadow-soft',
        'hover:bg-gray-50 hover:border-gray-400',
        'focus-visible:ring-gray-500',
        'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-500'
      ].join(' '),
      
      secondary: [
        'bg-gray-200 text-gray-900 shadow-soft',
        'hover:bg-gray-300 hover:shadow-medium',
        'focus-visible:ring-gray-500',
        'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
      ].join(' '),
      
      ghost: [
        'text-gray-700 hover:bg-gray-100',
        'focus-visible:ring-gray-500',
        'dark:text-gray-300 dark:hover:bg-gray-800'
      ].join(' '),
      
      link: [
        'text-primary-600 underline-offset-4 hover:underline',
        'focus-visible:ring-primary-500',
        'dark:text-primary-400'
      ].join(' '),
      
      neon: [
        'bg-transparent border-2 border-neon-cyan text-neon-cyan shadow-neon',
        'hover:bg-neon-cyan hover:text-gray-900 hover:shadow-neon-pink',
        'focus-visible:ring-neon-cyan',
        'transform transition-all duration-300'
      ].join(' '),
      
      success: [
        'bg-success-600 text-white shadow-soft',
        'hover:bg-success-700 hover:shadow-medium',
        'focus-visible:ring-success-500',
        'dark:bg-success-500 dark:hover:bg-success-600'
      ].join(' '),
      
      warning: [
        'bg-warning-600 text-white shadow-soft',
        'hover:bg-warning-700 hover:shadow-medium',
        'focus-visible:ring-warning-500',
        'dark:bg-warning-500 dark:hover:bg-warning-600'
      ].join(' '),
    };
    
    const sizes = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      default: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10 p-0',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        type={type}
        aria-disabled={isDisabled}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <div 
            className={cn(
              "animate-spin rounded-full border-2 border-current border-t-transparent",
              size === 'xs' && "w-3 h-3 mr-1",
              size === 'sm' && "w-4 h-4 mr-2",
              size === 'default' && "w-4 h-4 mr-2",
              size === 'lg' && "w-5 h-5 mr-2",
              size === 'icon' && "w-4 h-4"
            )}
            aria-hidden="true"
          />
        )}

        {/* Left Icon */}
        {leftIcon && !loading && size !== 'icon' && (
          <span 
            className={cn(
              "flex-shrink-0",
              size === 'xs' && "w-3 h-3 mr-1",
              size === 'sm' && "w-4 h-4 mr-1.5",
              size === 'default' && "w-4 h-4 mr-2",
              size === 'lg' && "w-5 h-5 mr-2"
            )}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        {/* Button Content */}
        {size !== 'icon' && (
          <span className={cn(loading && 'opacity-0')}>
            {children}
          </span>
        )}
        
        {/* Icon button content */}
        {size === 'icon' && !loading && children}

        {/* Right Icon */}
        {rightIcon && !loading && size !== 'icon' && (
          <span 
            className={cn(
              "flex-shrink-0",
              size === 'xs' && "w-3 h-3 ml-1",
              size === 'sm' && "w-4 h-4 ml-1.5",
              size === 'default' && "w-4 h-4 ml-2",
              size === 'lg' && "w-5 h-5 ml-2"
            )}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
));

Button.displayName = 'Button';