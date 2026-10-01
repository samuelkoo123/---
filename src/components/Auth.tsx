import React, { useState } from "react";
import { motion } from "motion/react";
import { Church, Lock, User, ArrowRight, Loader2, Settings, LogIn } from "lucide-react";
import * as firebaseService from "../services/firebaseService";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface AuthProps {
  onLogin: (token: string, church: any) => void;
  onAdminAccess: () => void;
}

export default function Auth({ onLogin, onAdminAccess }: AuthProps) {
  const [view, setView] = useState<"login" | "admin">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onAdminAccess();
    } catch (err: any) {
      setError("Google 로그인에 실패했습니다: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (view === "login") {
        const churchData = await firebaseService.loginChurch(name, password);
        if (!churchData) throw new Error("교회 이름 또는 비밀번호가 일치하지 않습니다.");
        
        const token = `church_${churchData.id}`;
        onLogin(token, churchData);
      } else {
        // Try server API first, fallback to client password comparison
        let verified = false;
        try {
          const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: adminPassword })
          });
          if (res.ok) {
            verified = true;
          }
        } catch {
          // If network / direct static deployment
        }

        const ADMIN_PASSWORD = "hepsiba1234";
        if (verified || (adminPassword && adminPassword.trim() === ADMIN_PASSWORD)) {
          onAdminAccess();
        } else {
          throw new Error("관리자 비밀번호가 틀립니다.");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5E5E5]"
      >
        <div className="p-8 bg-[#1A1A1A] text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Church className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">교회 재정 시스템</h1>
          <p className="text-white/60 text-sm mt-2 uppercase tracking-widest font-medium">
            {view === "login" ? "Church Login" : "System Admin Access"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="p-4 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100">{error}</div>}
          
          {view === "login" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">교회 이름</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                  <input required type="text" placeholder="교회 이름을 입력하세요" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                  <input required type="password" placeholder="비밀번호를 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">관리자 비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                  <input required autoFocus type="password" placeholder="관리자 비밀번호를 입력하세요" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all" />
                </div>
              </div>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#E5E5E5]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-[#A1A1AA] font-bold">또는</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdminGoogleLogin}
                className="w-full py-3 bg-white border border-[#E5E5E5] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#F9FAFB] transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Google로 관리자 로그인
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-4 bg-[#1A1A1A] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all flex items-center justify-center disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{view === "login" ? "로그인" : "인증하기"} <ArrowRight className="w-5 h-5 ml-2" /></>}
          </button>

          <div className="flex flex-col items-center gap-4 text-center">
            {view === "login" ? (
              <button 
                type="button" 
                onClick={() => { setView("admin"); setError(""); }}
                className="p-3 bg-[#F4F4F5] text-[#71717A] rounded-2xl hover:bg-[#E5E5E5] hover:text-[#1A1A1A] transition-all group flex flex-col items-center gap-1"
                title="시스템 관리자 로그인"
              >
                <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Admin</span>
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => { setView("login"); setError(""); }}
                className="text-sm text-[#71717A] hover:text-[#1A1A1A] font-bold"
              >
                교회 로그인으로 돌아가기
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
