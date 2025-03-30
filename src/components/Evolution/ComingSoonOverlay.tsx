'use client';

import { useState, useEffect } from 'react';

interface ComingSoonOverlayProps {
  launchDate: Date;
}

const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ launchDate }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // Calculate and format time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const diffMs = Math.max(0, launchDate.getTime() - now.getTime());
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    
    // Update immediately and then every second
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [launchDate]);
  
  // Format the launch date for display
  const formattedDate = launchDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const formattedTime = launchDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  return (
    <div className="w-full bg-gray-800 rounded-lg p-8 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-yellow-500 mb-4">
            Evolution Feature Coming Soon!
          </h2>
          <p className="text-xl text-white mb-6">
            The Evolution feature will be available on:
          </p>
          <div className="text-2xl font-bold text-white mb-2">
            {formattedDate}
          </div>
          <div className="text-2xl font-bold text-white mb-8">
            {formattedTime}
          </div>
          
          <div className="mb-8">
            <p className="text-lg text-gray-300 mb-2">Time Remaining:</p>
            <div className="text-3xl font-mono font-bold text-yellow-500">
              {timeRemaining}
            </div>
          </div>
          
          <div className="p-6 bg-gray-700 rounded-lg">
            <p className="text-white">
              Get ready to evolve your Primos into more powerful versions with special EvoZtones!
              Connect your Ronin Wallet when the feature launches to start your evolution journey.
            </p>
          </div>
        </div>
        
        {/* Preview image or video */}
        <div className="w-full max-w-md mx-auto">
          <video 
            src="/videos/piedras_o.webm" 
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-lg"
            poster="/images/frame_primo.png"
          />
        </div>
      </div>
    </div>
  );
};

export default ComingSoonOverlay;
