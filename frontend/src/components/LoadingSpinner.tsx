import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer Ring */}
      <div className={`${sizes[size]} rounded-full border-4 border-gold-900/30`} />
      
      {/* Spinning Segment */}
      <div className={`
        absolute top-0 left-0 ${sizes[size]} rounded-full border-4 border-transparent border-t-gold-500 
        animate-spin
      `} />
      
      {/* Inner Decorative Ring */}
      <div className={`
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
        ${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-8 h-8' : 'w-14 h-14'} 
        rounded-full border border-gold-300/20
      `} />
    </div>
  );
};
