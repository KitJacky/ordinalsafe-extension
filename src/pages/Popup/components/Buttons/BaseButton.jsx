import React from 'react';

const BaseButton = ({ text, icon, onClick, w, color, className, disabled }) => {
  return (
    <button
      onClick={onClick ? onClick : () => {}}
      className={`${disabled ? ' opacity-30 pointer-events-none' : ''} ${
        w ? 'w-' + w : 'w-40'
      } h-10 rounded-3xl ${
        color ? 'bg-' + color : 'bg-primary'
      } text-white px-3 py-2 text-sm font-white hover:bg-blue-700 transition-colors duration-200 ease-in-out flex items-center justify-center ${className}`}
    >
      {icon ? icon : null}
      {text}
    </button>
  );
};

export default BaseButton;
