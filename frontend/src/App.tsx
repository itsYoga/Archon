import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";
import Navigation from "./components/Navigation";
import NetworkStatus from "./components/NetworkStatus";
import Dashboard from "./pages/Dashboard";
import AssetRegistration from "./pages/AssetRegistration";
import MyAssets from "./pages/MyAssets";
import TokenManagement from "./pages/TokenManagement";
import AdminDashboard from "./pages/AdminDashboard";
import VerificationDashboard from "./pages/VerificationDashboard";
import RedemptionManagement from "./pages/RedemptionManagement";
import AssetDetails from "./pages/AssetDetails";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider as CustomThemeProvider } from "./contexts/ThemeContext";

const AppContent = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex">
        <Navigation />
        <div className="flex-1 md:ml-64">
          <NetworkStatus />
          <main className="p-4 md:p-8">
            <Routes>
              {/* 用戶端路由 */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/register-asset" element={<AssetRegistration />} />
              <Route path="/my-assets" element={<MyAssets />} />
              <Route path="/tokens" element={<TokenManagement />} />
              <Route path="/asset/:id" element={<AssetDetails />} />
              
              {/* 管理端路由 */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/verification" element={<VerificationDashboard />} />
              <Route path="/admin/redemption" element={<RedemptionManagement />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ToastProvider>
      <CustomThemeProvider>
        <Web3Provider>
          <AppContent />
        </Web3Provider>
      </CustomThemeProvider>
    </ToastProvider>
  );
}

export default App;
