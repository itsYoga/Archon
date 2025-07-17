import styled, { css } from 'styled-components';

export const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: var(--space-6) var(--space-4);
  background: ${({ theme }) => theme.background};
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  border-radius: 24px;
  box-shadow: ${({ theme }) => theme.shadow};
  padding: var(--space-5);
  margin-top: 48px;
  margin-bottom: var(--space-5);
  max-width: 480px;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.border};
  transition: all 0.3s;
  @media (max-width: 600px) {
    padding: var(--space-4) var(--space-2);
    margin-top: 16px;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin-bottom: var(--space-4);
  color: ${({ theme }) => theme.text};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding-bottom: var(--space-3);
`;

export const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: var(--space-4) 0;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-3);
`;

export const FlexCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

export const FormRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
`;

export const Input = styled.input`
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.inputBorder};
  font-size: 16px;
  width: 100%;
  background: ${({ theme }) => theme.inputBackground};
  color: ${({ theme }) => theme.text};
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: var(--font-mono);
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.primary}40`};
  }
`;

export const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  ${({ variant, theme }) => {
    switch (variant) {
      case 'danger':
        return css`background: ${theme.error}; color: #fff; &:hover:not(:disabled) { background: #c82333; }`;
      default:
        return css`background: ${theme.primary}; color: #fff; &:hover:not(:disabled) { background: #0056b3; }`;
    }
  }}
  &:disabled {
    background: ${({ theme }) => theme.buttonDisabled};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export const AddressDisplay = styled.span`
  font-family: var(--font-mono);
  background: ${({ theme }) => theme.inputBackground};
  padding: var(--space-1) var(--space-2);
  border-radius: 6px;
  font-size: 14px;
`; 