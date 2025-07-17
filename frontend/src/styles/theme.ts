export const lightTheme = {
  background: '#f6f8fa',
  cardBackground: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e1e5e9',
  primary: '#2d72d9',
  primaryHover: '#1e5bb8',
  success: '#27ae60',
  error: '#e74c3c',
  warning: '#f39c12',
  shadow: '0 2px 12px rgba(0,0,0,0.08)',
  inputBackground: '#ffffff',
  inputBorder: '#d1d5db',
  buttonDisabled: '#b2bec3',
};

export const darkTheme = {
  background: '#1a1a1a',
  cardBackground: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#404040',
  primary: '#4a9eff',
  primaryHover: '#3a8eef',
  success: '#2ecc71',
  error: '#e74c3c',
  warning: '#f39c12',
  shadow: '0 2px 12px rgba(0,0,0,0.3)',
  inputBackground: '#3a3a3a',
  inputBorder: '#555555',
  buttonDisabled: '#666666',
};

export type Theme = typeof lightTheme; 