import React from 'react';

const OrientationPrompt: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-casino-green-900 flex flex-col items-center justify-center text-casino-gold p-8 text-center md:hidden portrait:flex landscape:hidden">
      <div className="animate-bounce mb-8">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="rotate-90"
        >
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      </div>
      <h2 className="text-2xl font-serif font-bold mb-4">Please Rotate Your Device</h2>
      <p className="text-casino-gold-200 max-w-xs">
        For the best casino experience, please play Dehla Pakad in landscape mode.
      </p>
    </div>
  );
};

export default OrientationPrompt;
