import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";
import Navigation from "./components/Navigation";
import NetworkStatus from "./components/NetworkStatus";
import ProtectedRoute from "./components/ProtectedRoute";
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
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Navigation />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <NetworkStatus />
          </div>
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <Routes>
                {/* 用戶端路由 */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/register-asset" element={<AssetRegistration />} />
                <Route path="/my-assets" element={<MyAssets />} />
                <Route path="/tokens" element={<TokenManagement />} />
                <Route path="/asset/:id" element={<AssetDetails />} />
                
                {/* 管理端路由 - 需要管理員權限 */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/verification" element={
                  <ProtectedRoute requiredRole="VERIFIER">
                    <VerificationDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/redemption" element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <RedemptionManagement />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
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
