import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };
  
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-current ${sizeClasses[size]} ${colorClasses[color]}`} />
      {text && <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>}
    </div>
  );
};

export const LoadingOverlay: React.FC<{ isLoading: boolean; children: React.ReactNode }> = ({
  isLoading,
  children
}) => {
  if (!isLoading) return <>{children}</>;
  
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75">
        <LoadingSpinner />
      </div>
    </div>
  );
};
