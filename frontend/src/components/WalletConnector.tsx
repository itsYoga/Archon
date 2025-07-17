import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { lightTheme, darkTheme } from "../styles/theme";

export const WalletConnector: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const containerStyle: React.CSSProperties = {
    padding: "20px",
    textAlign: "center",
    background: currentTheme.cardBackground,
    borderBottom: `1px solid ${currentTheme.border}`,
    color: currentTheme.text,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    background: currentTheme.primary,
    color: "#fff",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
  };

  const accountStyle: React.CSSProperties = {
    fontFamily: "monospace",
    color: currentTheme.text,
    fontWeight: 600,
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast("請安裝 MetaMask!", "error");
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      showToast("錢包連接成功！", "success");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      showToast("連接錢包失敗", "error");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  return (
    <div style={containerStyle}>
      {account ? (
        <div>
          <span>已連接: </span>
          <span style={accountStyle}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <button
            onClick={disconnectWallet}
            style={{ ...buttonStyle, marginLeft: "10px", background: currentTheme.error }}
          >
            斷開連接
          </button>
        </div>
      ) : (
        <button onClick={connectWallet} style={buttonStyle} disabled={connecting}>
          {connecting ? "連接中..." : "連接錢包"}
        </button>
      )}
    </div>
  );
}; 