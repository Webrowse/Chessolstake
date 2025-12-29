import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
  );
};

export default Loader;