import React from 'react';

const Loader = ({ size = 'medium' }) => {
  const sizeMap = {
    small: { width: '20px', height: '20px', borderWidth: '2px' },
    medium: { width: '40px', height: '40px', borderWidth: '3px' },
    large: { width: '60px', height: '60px', borderWidth: '4px' }
  };

  const style = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div 
        className="spinner" 
        style={{
          width: style.width,
          height: style.height,
          border: `${style.borderWidth} solid rgba(255, 255, 255, 0.1)`,
          borderTop: `${style.borderWidth} solid var(--primary)`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
    </div>
  );
};

export default Loader;
