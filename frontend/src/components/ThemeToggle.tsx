import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px',
    borderRadius: '50%',
    border: 'none',
    background: theme === 'light' ? '#2d2d2d' : '#ffffff',
    color: theme === 'light' ? '#ffffff' : '#2d2d2d',
    cursor: 'pointer',
    fontSize: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <button onClick={toggleTheme} style={buttonStyle} title={`切換到${theme === 'light' ? '深色' : '淺色'}模式`}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle; 