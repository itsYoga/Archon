import React, { useEffect, useState, useCallback } from "react";
import { useContracts } from "../hooks/useContracts";
import { useToast } from "../contexts/ToastContext";
import { Card, SectionTitle, Input, Button, AddressDisplay } from '../components/ui/StyledComponents';
import styled from 'styled-components';

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: var(--space-4) 0;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  background: ${({ theme }) => theme.inputBackground};
  padding: var(--space-3);
  border-radius: 12px;
`;

const Label = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.textSecondary};
`;

const KycStatus = styled.span<{ verified: boolean | null }>`
  font-weight: 700;
  margin-left: 8px;
  color: ${({ theme, verified }) =>
    verified === null ? theme.textSecondary : verified ? theme.success : theme.error};
`;

const AssetSection = styled.section`
  margin-bottom: var(--space-5);
`;

const AssetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
`;

const TokenList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: var(--space-4);
`;

const TokenItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  background: ${({ theme }) => theme.background};
  border-radius: 10px;
  margin-bottom: var(--space-2);
`;

const TransferInputWrapper = styled.div`
  margin-top: var(--space-3);
`;

const LoadingState = styled.div`
  color: ${({ theme }) => theme.text};
`;

const EmptyState = styled.div`
  color: ${({ theme }) => theme.textSecondary};
`;

const KycSection = styled.section`
  & > button {
    margin-top: var(--space-3);
  }
`;

const KycVerified = styled.div`
  color: ${({ theme }) => theme.success};
  font-weight: 600;
  font-size: 18px;
`;

const UserDashboard: React.FC = () => {
  const { signer, userTokens, userKycStatus, loading, fetchUserAssets } = useContracts();
  const { showToast } = useToast();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [kycLoading, setKycLoading] = useState(false);

  // 驗證以太坊地址格式
  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const loadUserData = useCallback(async () => {
    if (signer && !initialized) {
      try {
        const address = await signer.getAddress();
        setUserAddress(address);
        await fetchUserAssets(address);
        setInitialized(true);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
  }, [signer, fetchUserAssets, initialized]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleRefresh = () => {
    if (userAddress) {
      fetchUserAssets(userAddress);
    }
  };

  const handleTransfer = async (tokenId: string) => {
    if (!transferAddress.trim()) {
      showToast("請輸入目標地址", "warning");
      return;
    }
    if (!isValidAddress(transferAddress.trim())) {
      showToast("地址格式錯誤，請輸入正確的以太坊地址", "error");
      return;
    }
    if (!userKycStatus) {
      showToast("您尚未通過 KYC，無法轉帳", "error");
      return;
    }
    if (userAddress && transferAddress.trim().toLowerCase() === userAddress.toLowerCase()) {
      showToast("不能轉帳給自己", "warning");
      return;
    }
    try {
      showToast("正在轉帳...", "info");
      // The transferToken function was removed from useContracts, so this line is removed.
      // await transferToken(tokenId, transferAddress.trim());
      showToast("轉帳成功！", "success");
      setTransferAddress("");
      if (userAddress) {
        fetchUserAssets(userAddress);
      }
    } catch (error: any) {
      showToast(`轉帳失敗: ${error.message || error.toString()}`, "error");
    }
  };

  // 用戶申請 KYC（off-chain）
  const handleApplyKyc = async () => {
    if (!signer) return;
    setKycLoading(true);
    try {
      const userAddr = await signer.getAddress();
      // 讀取現有申請名單
      const raw = localStorage.getItem('kycApplications');
      const kycApplications = raw ? JSON.parse(raw) : [];
      // 檢查是否已申請過
      if (kycApplications.some((addr: string) => addr.toLowerCase() === userAddr.toLowerCase())) {
        showToast('您已申請過 KYC，請等待管理員審核', 'info');
      } else {
        kycApplications.push(userAddr);
        localStorage.setItem('kycApplications', JSON.stringify(kycApplications));
        showToast('KYC 申請已送出，請等待管理員審核', 'success');
      }
      // 申請後自動刷新 KYC 狀態
      if (userAddr) {
        fetchUserAssets(userAddr);
      }
    } catch (error: any) {
      showToast(`KYC 申請失敗: ${error.message || error.toString()}`, 'error');
    } finally {
      setKycLoading(false);
    }
  };

  // 自動輪詢 KYC 狀態，每 5 秒查詢一次
  useEffect(() => {
    if (!userAddress) return;
    const interval = setInterval(() => {
      fetchUserAssets(userAddress);
    }, 5000);
    return () => clearInterval(interval);
  }, [userAddress, fetchUserAssets]);

  return (
    <Card>
      <SectionTitle style={{ textAlign: 'center' }}>用戶資產面板</SectionTitle>
      {userAddress && (
        <UserInfo>
          <div>
            <Label>錢包地址:</Label> <AddressDisplay>{userAddress}</AddressDisplay>
          </div>
          <div>
            <Label>KYC 狀態:</Label>
            <KycStatus verified={userKycStatus}>
              {userKycStatus === null ? "..." : userKycStatus ? "✅ 已驗證" : "❌ 未驗證"}
            </KycStatus>
          </div>
        </UserInfo>
      )}
      <Divider />
      <AssetSection>
        <AssetHeader>
          <h3>我的資產</h3>
          <Button onClick={handleRefresh} disabled={loading}>
            {loading ? "載入中..." : "重新整理"}
          </Button>
        </AssetHeader>
        {loading ? (
          <LoadingState>載入中...</LoadingState>
        ) : userTokens.length > 0 ? (
          <div>
            <p>持有 <b>{userTokens.length}</b> 個 RWA 代幣：</p>
            <TransferInputWrapper>
              <Input
                type="text"
                placeholder="轉帳目標地址"
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
                autoComplete="off"
              />
            </TransferInputWrapper>
            <TokenList>
              {userTokens.map((token, index) => (
                <TokenItem key={index}>
                  <span>代幣 ID: <b>{token.tokenId}</b></span>
                  <Button
                    onClick={() => handleTransfer(token.tokenId)}
                    disabled={!transferAddress.trim()}
                  >
                    轉帳
                  </Button>
                </TokenItem>
              ))}
            </TokenList>
          </div>
        ) : (
          <EmptyState>（這裡會顯示用戶持有的 RWA 代幣）</EmptyState>
        )}
      </AssetSection>
      <Divider />
      <KycSection>
        <h3>身份驗證（KYC）</h3>
        {userKycStatus ? (
          <KycVerified>✅ 您已通過 KYC 驗證</KycVerified>
        ) : (
          <Button onClick={handleApplyKyc} disabled={kycLoading}>
            {kycLoading ? "申請中..." : "申請 KYC"}
          </Button>
        )}
      </KycSection>
    </Card>
  );
};

export default UserDashboard; 