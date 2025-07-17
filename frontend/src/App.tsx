import React, { useState, useEffect } from "react";
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { WalletConnector } from "./components/WalletConnector";
import UserDashboard from "./pages/UserDashboard";
import AdminPanel from "./pages/AdminPanel";
import { lightTheme, darkTheme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyle';
import { Button } from './components/ui/StyledComponents';
import ThemeToggle from './components/ThemeToggle';
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider as CustomThemeProvider, useTheme } from "./contexts/ThemeContext";
import { useContracts } from "./hooks/useContracts";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  min-height: 100vh;
  padding: var(--space-4);
  background-color: ${({ theme }) => theme.background};
`;

const LogoText = styled.div`
  position: fixed;
  top: 24px;
  left: 32px;
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: ${({ theme }) => theme.primary};
  text-transform: uppercase;
  z-index: 1200;
  user-select: none;
`;

const MainContent = styled.main`
  width: 100%;
  max-width: 700px;
`;

const TabNavigation = styled.nav`
  display: flex;
  gap: var(--space-3);
  background-color: ${({ theme }) => theme.cardBackground};
  padding: var(--space-2);
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadow};
  border: 1px solid ${({ theme }) => theme.border};
`;

const TabButton = styled(Button)<{ $isActive?: boolean }>`
  background-color: ${({ theme, $isActive }) => $isActive ? theme.primary : 'transparent'};
  color: ${({ theme, $isActive }) => $isActive ? '#fff' : theme.textSecondary};
  font-weight: ${({ $isActive }) => $isActive ? '600' : '500'};
  &:hover {
    background-color: ${({ theme, $isActive }) => $isActive ? theme.primaryHover : theme.inputBackground};
  }
`;

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  const { theme } = useTheme();
  const themeObj = theme === 'light' ? lightTheme : darkTheme;
  const { rwaToken, signer } = useContracts();
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwner = async () => {
      if (rwaToken && signer) {
        try {
          const owner = await rwaToken.owner();
          setOwnerAddress(owner);
          const current = await signer.getAddress();
          setCurrentAddress(current);
        } catch (e) {}
      }
    };
    fetchOwner();
  }, [rwaToken, signer]);

  const isOwner = ownerAddress && currentAddress && ownerAddress.toLowerCase() === currentAddress.toLowerCase();

  return (
    <StyledThemeProvider theme={themeObj}>
      <GlobalStyle />
      <ThemeToggle />
      <LogoText>Archon</LogoText>
      <AppContainer>
        <WalletConnector />
        <TabNavigation>
          <TabButton onClick={() => setActiveTab("user")} $isActive={activeTab === 'user'}>
            用戶面板
          </TabButton>
          {isOwner && (
            <TabButton onClick={() => setActiveTab("admin")} $isActive={activeTab === 'admin'}>
              管理員面板
            </TabButton>
          )}
        </TabNavigation>
        <MainContent>
          {activeTab === "user" ? <UserDashboard /> : isOwner ? <AdminPanel /> : null}
        </MainContent>
      </AppContainer>
    </StyledThemeProvider>
  );
};

function App() {
  return (
    <ToastProvider>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </ToastProvider>
  );
}

export default App;
