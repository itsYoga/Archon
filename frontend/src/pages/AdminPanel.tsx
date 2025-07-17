import React, { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { useToast } from "../contexts/ToastContext";
import { Card, SectionTitle, Input, Button, PageWrapper, TitleBar, FormRow, Divider } from '../components/ui/StyledComponents';

const AdminPanel: React.FC = () => {
  const { rwaToken, didIdentity, signer } = useContracts();
  const { showToast } = useToast();
  const [mintAddress, setMintAddress] = useState("");
  const [kycAddress, setKycAddress] = useState("");

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
      } else {
        showToast(`發行失敗: ${error.message || error.toString()}`, "error");
      }
    }
  };

  const handleSetKyc = async (status: boolean) => {
    if (!didIdentity) return;
    if (!kycAddress.trim()) {
      showToast("請輸入用戶地址", "warning");
      return;
    }
    if (!isValidAddress(kycAddress.trim())) {
      showToast("地址格式錯誤，請輸入正確的以太坊地址", "error");
      return;
    }
    if (status === false && signer) {
      const currentAddress = await signer.getAddress();
      if (kycAddress.trim().toLowerCase() === currentAddress.toLowerCase()) {
        showToast("不能撤銷自己 KYC", "warning");
        return;
      }
    }
    try {
      showToast("正在更新 KYC 狀態...", "info");
      const tx = await didIdentity.setKycStatus(kycAddress.trim(), status);
      await tx.wait();
      showToast(`KYC ${status ? "通過" : "撤銷"} 成功！`, "success");
      setKycAddress("");
    } catch (error: any) {
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        showToast("您已拒絕 MetaMask 簽名", "error");
      } else {
        showToast(`KYC 更新失敗: ${error.message || error.toString()}`, "error");
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
      } else {
        showToast(`KYC 設置失敗: ${error.message || error.toString()}`, "error");
      }
    }
  };

  return (
    <PageWrapper>
      <Card>
        <SectionTitle style={{ textAlign: 'center' }}>管理員面板</SectionTitle>
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
          <Button onClick={() => handleSetKyc(true)} disabled={!kycAddress}>通過</Button>
          <Button onClick={() => handleSetKyc(false)} disabled={!kycAddress} variant="danger">撤銷</Button>
        </FormRow>
      </Card>
    </PageWrapper>
  );
};

export default AdminPanel; 