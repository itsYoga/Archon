import React, { useState, useEffect } from "react";
import { useContracts } from "../hooks/useContracts";
import { useToast } from "../contexts/ToastContext";
import { Card, SectionTitle, Input, Button, PageWrapper, TitleBar, FormRow, Divider } from '../components/ui/StyledComponents';

const AdminPanel: React.FC = () => {
  const { rwaToken, didIdentity, signer } = useContracts();
  const { showToast } = useToast();
  const [mintAddress, setMintAddress] = useState("");
  const [kycAddress, setKycAddress] = useState("");
  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [kycApplications, setKycApplications] = useState<string[]>([]);

  // 讀取申請名單
  useEffect(() => {
    const raw = localStorage.getItem('kycApplications');
    setKycApplications(raw ? JSON.parse(raw) : []);
  }, []);

  // 管理員審核後移除申請
  const handleApproveKyc = async (address: string) => {
    await handleSetKycForAdmin(address, true);
    removeKycApplication(address);
  };
  const handleRevokeKyc = async (address: string) => {
    await handleSetKycForAdmin(address, false);
    removeKycApplication(address);
  };
  const removeKycApplication = (address: string) => {
    const updated = kycApplications.filter(a => a.toLowerCase() !== address.toLowerCase());
    setKycApplications(updated);
    localStorage.setItem('kycApplications', JSON.stringify(updated));
  };
  // 封裝管理員設置 KYC
  const handleSetKycForAdmin = async (address: string, status: boolean) => {
    if (!didIdentity) return;
    try {
      showToast('正在更新 KYC 狀態...', 'info');
      const tx = await didIdentity.setKycStatus(address, status);
      await tx.wait();
      showToast(`KYC ${status ? '通過' : '撤銷'} 成功！`, 'success');
    } catch (error: any) {
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        showToast('您已拒絕 MetaMask 簽名', 'error');
      } else if (error.reason === 'Not admin' || error.message?.includes('Not admin')) {
        showToast('您不是管理員，無法執行此操作', 'error');
      } else {
        showToast(`KYC 更新失敗: ${error.message || error.toString()}`, 'error');
      }
    }
  };

  useEffect(() => {
    const fetchAdmin = async () => {
      if (didIdentity && signer) {
        try {
          const admin = await didIdentity.admin();
          setAdminAddress(admin);
          const current = await signer.getAddress();
          setCurrentAddress(current);
        } catch (e) {
          // 忽略錯誤
        }
      }
    };
    fetchAdmin();
  }, [didIdentity, signer]);

  // 驗證以太坊地址格式
  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rwaToken) return;
    if (!mintAddress.trim()) {
      showToast("請輸入目標地址", "warning");
      return;
    }
    if (!isValidAddress(mintAddress.trim())) {
      showToast("地址格式錯誤，請輸入正確的以太坊地址", "error");
      return;
    }
    try {
      showToast("正在發行代幣...", "info");
      const tx = await rwaToken.mint(mintAddress.trim());
      await tx.wait();
      showToast("代幣發行成功！", "success");
      setMintAddress("");
    } catch (error: any) {
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        showToast("您已拒絕 MetaMask 簽名", "error");
      } else if (error.reason === "Not admin" || error.message?.includes("Not admin")) {
        showToast("您不是管理員，無法執行此操作", "error");
      } else if (error.reason === "Not owner" || error.message?.includes("Not owner")) {
        showToast("您不是合約擁有者，無法執行此操作", "error");
      } else {
        showToast(`發行失敗: ${error.message || error.toString()}`, "error");
      }
    }
  };

  const handleSetCurrentUserKyc = async () => {
    if (!didIdentity || !signer) return;
    try {
      const currentAddress = await signer.getAddress();
      showToast("正在為當前用戶設置 KYC...", "info");
      const tx = await didIdentity.setKycStatus(currentAddress, true);
      await tx.wait();
      showToast("當前用戶 KYC 設置成功！", "success");
    } catch (error: any) {
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        showToast("您已拒絕 MetaMask 簽名", "error");
      } else if (error.reason === "Not admin" || error.message?.includes("Not admin")) {
        showToast("您不是管理員，無法執行此操作", "error");
      } else if (error.reason === "Not owner" || error.message?.includes("Not owner")) {
        showToast("您不是合約擁有者，無法執行此操作", "error");
      } else {
        showToast(`KYC 設置失敗: ${error.message || error.toString()}`, "error");
      }
    }
  };

  return (
    <PageWrapper>
      <Card>
        <SectionTitle style={{ textAlign: 'center' }}>管理員面板</SectionTitle>
        <div style={{ marginBottom: 16, fontSize: 15 }}>
          <b>管理員地址：</b>
          <span>{adminAddress || '載入中...'}</span>
          <br />
          <b>當前帳戶：</b>
          <span>{currentAddress || '載入中...'}</span>
          <br />
          {adminAddress && currentAddress && (
            <span style={{ color: adminAddress.toLowerCase() === currentAddress.toLowerCase() ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>
              {adminAddress.toLowerCase() === currentAddress.toLowerCase()
                ? '（你是管理員）'
                : '（你不是管理員）'}
            </span>
          )}
        </div>
        <TitleBar>
          <h3>快速設置</h3>
        </TitleBar>
        <FormRow>
          <Button onClick={handleSetCurrentUserKyc}>為當前用戶設置 KYC</Button>
        </FormRow>
        <Divider />
        <TitleBar>
          <h3>發行 RWA 代幣</h3>
        </TitleBar>
        <form onSubmit={handleMint}>
          <FormRow>
            <Input
              type="text"
              placeholder="目標地址"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={!mintAddress}>Mint</Button>
          </FormRow>
        </form>
        <Divider />
        <TitleBar>
          <h3>KYC 狀態管理</h3>
        </TitleBar>
        <FormRow>
          <Input
            type="text"
            placeholder="用戶地址"
            value={kycAddress}
            onChange={(e) => setKycAddress(e.target.value)}
            autoComplete="off"
            style={{ flex: 1 }}
          />
          {/* <Button onClick={() => handleSetKyc(true)} disabled={!kycAddress}>通過</Button>
          <Button onClick={() => handleSetKyc(false)} disabled={!kycAddress} variant="danger">撤銷</Button> */}
        </FormRow>
        <TitleBar>
          <h3>待審核 KYC 申請</h3>
        </TitleBar>
        <div style={{ marginBottom: 24, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          {kycApplications.length === 0 ? (
            <div style={{ color: '#888' }}>目前沒有待審核的 KYC 申請</div>
          ) : (
            <ul style={{ padding: 0, listStyle: 'none' }}>
              {kycApplications.map((addr) => (
                <li key={addr} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 12,
                  background: '#222',
                  borderRadius: 10,
                  padding: '16px 16px',
                  width: '100%',
                  boxSizing: 'border-box',
                  justifyContent: 'space-between',
                  minWidth: 0
                }}>
                  <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>{addr}</span>
                  <div style={{ display: 'flex', gap: 12, marginLeft: 16 }}>
                    <Button onClick={() => handleApproveKyc(addr)} style={{ width: 100 }}>通過</Button>
                    <Button onClick={() => handleRevokeKyc(addr)} variant="danger" style={{ width: 100 }}>撤銷</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </PageWrapper>
  );
};

export default AdminPanel; 