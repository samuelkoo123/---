import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import MemberManager from "./components/MemberManager";
import TransactionManager from "./components/TransactionManager";
import ReportManager from "./components/ReportManager";
import DataManager from "./components/DataManager";
import Auth from "./components/Auth";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [token, setToken] = useState<string | null>(sessionStorage.getItem("church_token"));
  const [church, setChurch] = useState<any>(JSON.parse(sessionStorage.getItem("church_info") || "null"));
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (newToken: string, newChurch: any) => {
    sessionStorage.setItem("church_token", newToken);
    sessionStorage.setItem("church_info", JSON.stringify(newChurch));
    setToken(newToken);
    setChurch(newChurch);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("church_token");
    sessionStorage.removeItem("church_info");
    setToken(null);
    setChurch(null);
    setIsAdmin(false);
  };

  if (isAdmin) {
    return <AdminPanel onExit={() => setIsAdmin(false)} />;
  }

  if (!token) {
    return <Auth onLogin={handleLogin} onAdminAccess={() => setIsAdmin(true)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "members":
        return <MemberManager />;
      case "transactions":
        return <TransactionManager />;
      case "reports":
        return <ReportManager church={church} />;
      case "export":
        return <DataManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} church={church} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}
