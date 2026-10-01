import React from "react";
import { LayoutDashboard, Users, Heart, ArrowLeftRight, FileText, Menu, X, LogOut, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  church: any;
  onLogout: () => void;
}

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "members", label: "교인관리", icon: Users },
  { id: "transactions", label: "입출금관리", icon: ArrowLeftRight },
  { id: "reports", label: "보고서/영수증", icon: FileText },
  { id: "export", label: "데이터 관리", icon: Database },
];

export default function Layout({ children, activeTab, setActiveTab, church, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1A1A1A] font-sans">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-white border-r border-[#E5E5E5] lg:block z-50">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-[#E5E5E5]">
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A] truncate">{church?.name || "은혜 교회 재정"}</h1>
            <p className="text-xs text-[#71717A] mt-1 font-medium uppercase tracking-wider">Church Finance</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  activeTab === item.id
                    ? "bg-[#1A1A1A] text-white shadow-lg shadow-black/5"
                    : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#1A1A1A]"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3", activeTab === item.id ? "text-white" : "text-[#A1A1AA]")} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-[#E5E5E5] space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs font-bold">AD</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A] truncate">관리자</p>
                <p className="text-[10px] text-[#71717A] uppercase tracking-widest">Administrator</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 z-50">
        <h1 className="text-lg font-bold truncate max-w-[200px]">{church?.name || "은혜 교회 재정"}</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg hover:bg-[#F4F4F5]">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden shadow-2xl"
            >
              <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
                <h1 className="text-xl font-bold truncate">{church?.name || "은혜 교회 재정"}</h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#F4F4F5]">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-4 py-4 text-base font-medium rounded-xl transition-all",
                      activeTab === item.id
                        ? "bg-[#1A1A1A] text-white"
                        : "text-[#71717A] hover:bg-[#F4F4F5]"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-4" />
                    {item.label}
                  </button>
                ))}
                <div className="pt-4 mt-4 border-t border-[#E5E5E5]">
                  <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-4 text-base font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-4" />
                    로그아웃
                  </button>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
