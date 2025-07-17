import React, { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { lightTheme, darkTheme } from "../styles/theme";

const AdminPanel: React.FC = () => {
  const { rwaToken, didIdentity, signer } = useContracts();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [mintAddress, setMintAddress] = useState("");
  const [kycAddress, setKycAddress] = useState("");

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const cardStyle: React.CSSProperties = {
    background: currentTheme.cardBackground,
    borderRadius: 16,
    boxShadow: currentTheme.shadow,
    padding: 32,
    marginBottom: 32,
    maxWidth: 500,
    marginLeft: "auto",
    marginRight: "auto",
    border: `1px solid ${currentTheme.border}`,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 16,
    color: currentTheme.text,
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 8,
    border: `1px solid ${currentTheme.inputBorder}`,
    fontSize: 16,
    marginRight: 8,
    width: 280,
    background: currentTheme.inputBackground,
    color: currentTheme.text,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: currentTheme.primary,
    color: "#fff",
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const buttonDisabled: React.CSSProperties = {
    ...buttonStyle,
    background: currentTheme.buttonDisabled,
    cursor: "not-allowed",
  };

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
      showToast(`發行失敗: ${error.message || error.toString()}`, "error");
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
      showToast(`KYC 更新失敗: ${error.message || error.toString()}`, "error");
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
      showToast(`KYC 設置失敗: ${error.message || error.toString()}`, "error");
    }
  };

  return (
    <div style={{ background: currentTheme.background, minHeight: "100vh", padding: "40px 0" }}>
      <div style={cardStyle}>
        <h2 style={{ ...sectionTitle, textAlign: "center" }}>管理員面板</h2>
        {/* 快速設置當前用戶 KYC */}
        <section style={{ 
          marginBottom: 32, 
          padding: 16, 
          backgroundColor: theme === 'light' ? '#f0f4fa' : '#3a3a3a', 
          borderRadius: 12 
        }}>
          <h3 style={sectionTitle}>快速設置</h3>
          <button onClick={handleSetCurrentUserKyc} style={buttonStyle}>
            為當前用戶設置 KYC
          </button>
          {/* kycStatus 移除 */}
        </section>
        {/* Mint RWA */}
        <section style={{ marginBottom: 32 }}>
          <h3 style={sectionTitle}>發行 RWA 代幣</h3>
          <form onSubmit={handleMint} style={{ display: "flex", alignItems: "center" }}>
            <input
              type="text"
              placeholder="目標地址"
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={mintAddress ? buttonStyle : buttonDisabled} disabled={!mintAddress}>
              Mint
            </button>
          </form>
          {/* mintStatus 移除 */}
        </section>
        {/* KYC 管理 */}
        <section>
          <h3 style={sectionTitle}>KYC 狀態管理</h3>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="text"
              placeholder="用戶地址"
              value={kycAddress}
              onChange={(e) => setKycAddress(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={() => handleSetKyc(true)}
              disabled={!kycAddress}
              style={kycAddress ? buttonStyle : buttonDisabled}
            >
              通過
            </button>
            <button
              onClick={() => handleSetKyc(false)}
              disabled={!kycAddress}
              style={kycAddress ? { ...buttonStyle, background: currentTheme.error } : buttonDisabled}
            >
              撤銷
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel; 