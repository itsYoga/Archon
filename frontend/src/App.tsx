import React, { useState } from "react";
import { WalletConnector } from "./components/WalletConnector";
import UserDashboard from "./pages/UserDashboard";
import AdminPanel from "./pages/AdminPanel";
import { ThemeProvider as CustomThemeProvider, useTheme } from "./contexts/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyle';
import { lightTheme, darkTheme } from './styles/theme';
import { Button } from './components/ui/StyledComponents';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  const { theme } = useTheme();
  const themeObj = theme === 'light' ? lightTheme : darkTheme;

  return (
    <StyledThemeProvider theme={themeObj}>
      <GlobalStyle />
      <ThemeToggle />
      <WalletConnector />
      {activeTab === "user" ? <UserDashboard /> : <AdminPanel />}
      <div style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "10px"
      }}>
        <Button
          onClick={() => setActiveTab("user")}
          variant={activeTab === "user" ? "primary" : undefined}
          style={{ opacity: activeTab === "user" ? 1 : 0.7 }}
        >
          用戶面板
        </Button>
        <Button
          onClick={() => setActiveTab("admin")}
          variant={activeTab === "admin" ? "primary" : undefined}
          style={{ opacity: activeTab === "admin" ? 1 : 0.7 }}
        >
          管理員面板
        </Button>
      </div>
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
