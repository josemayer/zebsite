import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div 
        className="
          border-4   
          border-gray-300 
          border-t-blue-500
          rounded-full    
          w-12 h-12      
          animate-spin 
        "
        aria-label="Loading"
      />

    </div>
  );
};

export default Loading; 
