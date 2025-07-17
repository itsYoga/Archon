import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <ToggleButton themeMode={theme} onClick={toggleTheme} title={`切換到${theme === 'light' ? '深色' : '淺色'}模式`}>
      {theme === 'light' ? '🌙' : '☀️'}
    </ToggleButton>
  );
};

const ToggleButton = styled.button<{ themeMode: 'light' | 'dark' }>`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px;
  border-radius: 50%;
  border: none;
  background: ${({ themeMode }) => themeMode === 'light' ? '#2d2d2d' : '#ffffff'};
  color: ${({ themeMode }) => themeMode === 'light' ? '#ffffff' : '#2d2d2d'};
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
  transition: all 0.3s ease;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  }
`;

export default ThemeToggle; 