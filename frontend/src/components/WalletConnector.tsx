import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { useWeb3 } from "../contexts/Web3Context";
import { Card, Button, FlexRow, AddressDisplay } from "./ui/StyledComponents";
import styled from "styled-components";

export const WalletConnector: React.FC = () => {
  const { account, isConnected, isConnecting, connect, disconnect } = useWeb3();
  const { showToast } = useToast();

  return (
    <WalletBar>
      {isConnected && account ? (
        <FlexRow style={{ justifyContent: "space-between", width: "100%" }}>
          <span>已連接:</span>
          <AddressDisplay>{account.slice(0, 6)}...{account.slice(-4)}</AddressDisplay>
          <Button onClick={disconnect} variant="danger">斷開連接</Button>
        </FlexRow>
      ) : (
        <Button onClick={connect} disabled={isConnecting} style={{ width: "100%" }}>
          {isConnecting ? "連接中..." : "連接錢包"}
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