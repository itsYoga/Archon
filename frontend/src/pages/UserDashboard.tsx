import React, { useEffect, useState, useCallback } from "react";
import { useContracts } from "../hooks/useContracts";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { lightTheme, darkTheme } from "../styles/theme";

const UserDashboard: React.FC = () => {
  const { signer, userTokens, userKycStatus, loading, fetchUserAssets, transferToken } = useContracts();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");

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

  const labelStyle: React.CSSProperties = {
    fontWeight: 500,
    color: currentTheme.textSecondary,
  };

  const statusStyle = (verified: boolean | null) => ({
    color: verified === null ? currentTheme.textSecondary : verified ? currentTheme.success : currentTheme.error,
    fontWeight: 700,
    marginLeft: 8,
  });

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
      await transferToken(tokenId, transferAddress.trim());
      showToast("轉帳成功！", "success");
      setTransferAddress("");
      if (userAddress) {
        fetchUserAssets(userAddress);
      }
    } catch (error: any) {
      showToast(`轉帳失敗: ${error.message || error.toString()}`, "error");
    }
  };

  return (
    <div style={{ background: currentTheme.background, minHeight: "100vh", padding: "40px 0" }}>
      <div style={cardStyle}>
        <h2 style={{ ...sectionTitle, textAlign: "center" }}>用戶資產面板</h2>
        {userAddress && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={labelStyle}>地址:</span> <span style={{ fontFamily: "monospace", color: currentTheme.text }}>{userAddress}</span>
            </div>
            <div>
              <span style={labelStyle}>KYC 狀態:</span>
              <span style={statusStyle(userKycStatus)}>
                {userKycStatus === null ? "載入中..." : userKycStatus ? "✅ 已驗證" : "❌ 未驗證"}
              </span>
            </div>
          </div>
        )}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={sectionTitle}>我的資產</h3>
            <button onClick={handleRefresh} style={loading ? buttonDisabled : buttonStyle} disabled={loading}>
              {loading ? "載入中..." : "重新整理"}
            </button>
          </div>
          {loading ? (
            <div style={{ color: currentTheme.text }}>載入中...</div>
          ) : userTokens.length > 0 ? (
            <div>
              <p style={{ marginBottom: 16, color: currentTheme.text }}>持有 <b>{userTokens.length}</b> 個 RWA 代幣：</p>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="轉帳目標地址"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  style={inputStyle}
                  autoComplete="off"
                />
              </div>
              {/* 移除 transferStatus 顯示，toast 取代 */}
              <ul style={{ paddingLeft: 0 }}>
                {userTokens.map((token, index) => (
                  <li key={index} style={{ marginBottom: 12, listStyle: "none", display: "flex", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 16, color: currentTheme.text }}>代幣 ID: {token.tokenId}</span>
                    <button
                      onClick={() => handleTransfer(token.tokenId)}
                      style={transferAddress.trim() ? buttonStyle : buttonDisabled}
                      disabled={!transferAddress.trim()}
                    >
                      轉帳
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ color: currentTheme.textSecondary }}>（這裡會顯示用戶持有的 RWA 代幣）</div>
          )}
        </section>
        <section>
          <h3 style={sectionTitle}>身份驗證（KYC）</h3>
          {userKycStatus ? (
            <div style={{ color: currentTheme.success, fontWeight: 600, fontSize: 18 }}>✅ 您已通過 KYC 驗證</div>
          ) : (
            <button style={buttonStyle}>申請 KYC</button>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserDashboard; 