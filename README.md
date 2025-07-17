# Archon RWA Tokenization DApp

本專案是一個全端 DApp，實現真實世界資產（RWA）上鏈、KYC 驗證與合規轉帳。包含 Hardhat 智能合約（Solidity）與 React 前端，支援本地測試與現代化 UI/UX。

---

## 目錄
- [專案簡介](#專案簡介)
- [功能特色](#功能特色)
- [技術棧](#技術棧)
- [安裝與啟動](#安裝與啟動)
- [使用說明](#使用說明)
- [常見問題](#常見問題)
- [聯絡方式](#聯絡方式)

---

## 專案簡介

本 DApp 讓管理員可發行 RWA NFT，並對用戶進行 KYC 驗證。只有通過 KYC 的用戶才能接收/轉讓資產，確保合規。

---

## 功能特色
- **KYC 驗證**：僅管理員可設置/撤銷用戶 KYC 狀態。
- **RWA NFT 發行**：管理員可發行 ERC721 代幣給指定地址。
- **合規轉帳**：僅 KYC 通過者可收/轉 NFT。
- **現代化前端**：支援深色/淺色模式、toast 通知、表單驗證、響應式設計。
- **本地測試鏈**：使用 Hardhat node，無需真實資金。

---

## 技術棧
- **智能合約**：Solidity, Hardhat
- **前端**：React, Vite, ethers.js
- **UI/UX**：現代化設計、深色/淺色模式、全局 toast

---

## 安裝與啟動

### 1. 啟動 Hardhat 本地區塊鏈
```sh
cd backend # 或合約目錄
npm install
npx hardhat node
```

### 2. 部署智能合約
（另開一個終端機）
```sh
npx hardhat run scripts/deploy.ts --network localhost
```

### 3. 啟動前端
```sh
cd frontend
npm install
npm run dev
```

### 4. 連接錢包
- 使用 MetaMask 新增本地網路（http://127.0.0.1:8545）
- 匯入 Hardhat node 顯示的私鑰
- 進入前端網址（如 http://localhost:5173）

---

## 使用說明
- **管理員面板**：設置用戶 KYC、發行 NFT
- **用戶面板**：查看資產、KYC 狀態、嘗試轉帳
- **錢包連接**：支援 MetaMask，切換帳號測試不同角色
- **通知與驗證**：所有操作有即時 toast 提示，表單有格式驗證

---

## 常見問題
- **合約地址不符**：請確認前端設定與部署地址一致
- **端口衝突**：Hardhat 預設 8545，Vite 預設 5173
- **權限問題**：請用 Hardhat node 給的帳號測試
- **KYC 限制**：未通過 KYC 無法收/轉 NFT

---

## 聯絡方式
如有問題，請開 issue 或聯絡專案擁有者。
