import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-subtle ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
