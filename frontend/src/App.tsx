import React, { useState } from "react";
import { WalletConnector } from "./components/WalletConnector";
import UserDashboard from "./pages/UserDashboard";
import AdminPanel from "./pages/AdminPanel";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { ToastProvider } from "./contexts/ToastContext";

function App() {
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");

  return (
    <ToastProvider>
      <ThemeProvider>
        <div style={{ minHeight: "100vh" }}>
          <ThemeToggle />
          <WalletConnector />
          {activeTab === "user" ? (
            <UserDashboard />
          ) : (
            <AdminPanel />
          )}
          <div style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px"
          }}>
            <button
              onClick={() => setActiveTab("user")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "user" ? "#2d72d9" : "#e1e5e9",
                color: activeTab === "user" ? "#fff" : "#333",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              用戶面板
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "admin" ? "#2d72d9" : "#e1e5e9",
                color: activeTab === "admin" ? "#fff" : "#333",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              管理員面板
            </button>
          </div>
        </div>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
