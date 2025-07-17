import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { Card, Button, FlexRow, AddressDisplay } from "./ui/StyledComponents";
import styled from "styled-components";

export const WalletConnector: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if ((window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      showToast("請安裝 MetaMask!", "error");
      return;
    }
    setConnecting(true);
    try {
      const accounts = await (window as any).ethereum.request({
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
    <WalletBar>
      {account ? (
        <FlexRow style={{ justifyContent: "space-between", width: "100%" }}>
          <span>已連接:</span>
          <AddressDisplay>{account.slice(0, 6)}...{account.slice(-4)}</AddressDisplay>
          <Button onClick={disconnectWallet} variant="danger">斷開連接</Button>
        </FlexRow>
      ) : (
        <Button onClick={connectWallet} disabled={connecting} style={{ width: "100%" }}>
          {connecting ? "連接中..." : "連接錢包"}
        </Button>
      )}
    </WalletBar>
  );
};

const WalletBar = styled(Card)`
  width: 100%;
  max-width: 600px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 32px;
  background: ${({ theme }) => theme.cardBackground};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`; 