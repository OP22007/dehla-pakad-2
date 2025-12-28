import React from 'react';

interface CasinoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const CasinoButton: React.FC<CasinoButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = "relative px-8 py-3 rounded-lg font-playfair font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg";
  
  const variants = {
    primary: "bg-gold-gradient text-casino-green-900 border-2 border-gold-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]",
    secondary: "bg-casino-green-800 text-gold-100 border-2 border-gold-500 hover:bg-casino-green-700 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {/* Shine effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </button>
  );
};
