import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --font-sans: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
    --font-mono: 'Fira Code', 'Roboto Mono', monospace;
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 16px;
    --space-4: 24px;
    --space-5: 32px;
    --space-6: 48px;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--font-sans);
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    transition: background-color 0.3s ease, color 0.3s ease;
    min-height: 100vh;
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.text};
    font-weight: 700;
    line-height: 1.2;
  }

  p {
    margin-bottom: var(--space-3);
  }

  button {
    font-family: var(--font-sans);
    cursor: pointer;
  }

  a {
    color: ${({ theme }) => theme.primary};
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    text-decoration: underline;
  }
`; 