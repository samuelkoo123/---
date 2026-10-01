import React, { useState } from "react";
import { motion } from "motion/react";
import { Church, Lock, User, ArrowRight, Loader2, Settings } from "lucide-react";
import * as firebaseService from "../services/firebaseService";

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
              
              {/* 아름다운 꽃무늬 장식 (Floral Ornament) */}
              <div className="py-4 px-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-emerald-50/50 border border-rose-100/70 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                <svg
                  viewBox="0 0 280 84"
                  className="w-full max-w-[250px] h-auto drop-shadow-sm select-none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FB7185" />
                      <stop offset="50%" stopColor="#F43F5E" />
                      <stop offset="100%" stopColor="#BE123C" />
                    </linearGradient>
                    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FDE047" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                    <linearGradient id="softPetal" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFE4E6" />
                      <stop offset="100%" stopColor="#FDA4AF" />
                    </linearGradient>
                  </defs>

                  {/* 좌측 덩굴 및 잎사귀 */}
                  <path
                    d="M140 42 C 118 42, 98 30, 65 35 C 45 37, 26 26, 12 40"
                    stroke="url(#leafGrad)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M85 33 C 78 22, 63 20, 58 29 C 67 31, 76 31, 85 33 Z"
                    fill="url(#leafGrad)"
                    opacity="0.85"
                  />
                  <path
                    d="M106 37 C 101 26, 90 24, 88 33 C 94 35, 101 37, 106 37 Z"
                    fill="url(#leafGrad)"
                    opacity="0.8"
                  />
                  <path
                    d="M52 36 C 47 46, 34 48, 32 39 C 39 37, 46 37, 52 36 Z"
                    fill="url(#leafGrad)"
                    opacity="0.85"
                  />
                  <circle cx="21" cy="38" r="3.8" fill="url(#flowerGrad)" />
                  <circle cx="14" cy="40" r="2.4" fill="url(#flowerGrad)" opacity="0.8" />

                  {/* 우측 덩굴 및 잎사귀 */}
                  <path
                    d="M140 42 C 162 42, 182 30, 215 35 C 235 37, 254 26, 268 40"
                    stroke="url(#leafGrad)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M195 33 C 202 22, 217 20, 222 29 C 213 31, 204 31, 195 33 Z"
                    fill="url(#leafGrad)"
                    opacity="0.85"
                  />
                  <path
                    d="M174 37 C 179 26, 190 24, 192 33 C 186 35, 179 37, 174 37 Z"
                    fill="url(#leafGrad)"
                    opacity="0.8"
                  />
                  <path
                    d="M228 36 C 233 46, 246 48, 248 39 C 241 37, 234 37, 228 36 Z"
                    fill="url(#leafGrad)"
                    opacity="0.85"
                  />
                  <circle cx="259" cy="38" r="3.8" fill="url(#flowerGrad)" />
                  <circle cx="266" cy="40" r="2.4" fill="url(#flowerGrad)" opacity="0.8" />

                  {/* 좌우 보조 꽃봉오리 */}
                  <g transform="translate(44, 29)">
                    <circle cx="0" cy="0" r="4.2" fill="url(#softPetal)" />
                    <circle cx="-3" cy="-1" r="2.6" fill="url(#flowerGrad)" opacity="0.85" />
                    <circle cx="3" cy="-1" r="2.6" fill="url(#flowerGrad)" opacity="0.85" />
                    <circle cx="0" cy="3" r="2.6" fill="url(#flowerGrad)" opacity="0.85" />
                    <circle cx="0" cy="0" r="1.6" fill="url(#goldGrad)" />
                  </g>
                  <g transform="translate(236, 29)">
                    <circle cx="0" cy="0" r="4.2" fill="url(#softPetal)" />
                    <circle cx="-3" cy="-1" r="2.6" fill="url(#flowerGrad)" opacity="0.85" />
                    <circle cx="3" cy="-1" r="2.6" fill="url(#flowerGrad)" opacity="0.85" />
                    <circle cx="0" cy="3" r="2.6" fill="url(#flowerGrad)" opacity="0.85" />
                    <circle cx="0" cy="0" r="1.6" fill="url(#goldGrad)" />
                  </g>

                  {/* 중앙 피어나는 활짝 핀 꽃 (Rose / Camellia Blossom) */}
                  <g transform="translate(140, 42)">
                    {/* 바깥쪽 꽃잎 8방향 */}
                    <path d="M0 -24 C-7 -20 -9 -9 0 0 C9 -9 7 -20 0 -24Z" fill="url(#softPetal)" opacity="0.9" />
                    <path d="M0 24 C-7 20 -9 9 0 0 C9 9 7 20 0 24Z" fill="url(#softPetal)" opacity="0.9" />
                    <path d="M-24 0 C-20 -7 -9 -9 0 0 C-9 9 -20 7 -24 0Z" fill="url(#softPetal)" opacity="0.9" />
                    <path d="M24 0 C20 -7 9 -9 0 0 C9 9 20 7 24 0Z" fill="url(#softPetal)" opacity="0.9" />

                    {/* 대각선 꽃잎 */}
                    <path d="M-17 -17 C-18 -9 -9 -6 0 0 C-6 -9 -9 -18 -17 -17Z" fill="url(#flowerGrad)" opacity="0.85" />
                    <path d="M17 -17 C18 -9 9 -6 0 0 C6 -9 9 -18 17 -17Z" fill="url(#flowerGrad)" opacity="0.85" />
                    <path d="M-17 17 C-18 9 -9 6 0 0 C-6 9 -9 18 -17 17Z" fill="url(#flowerGrad)" opacity="0.85" />
                    <path d="M17 17 C18 9 9 6 0 0 C6 9 9 18 17 17Z" fill="url(#flowerGrad)" opacity="0.85" />

                    {/* 안쪽 겹꽃잎 */}
                    <ellipse cx="0" cy="-7" rx="7" ry="9" fill="url(#flowerGrad)" opacity="0.95" />
                    <ellipse cx="-7" cy="2" rx="8" ry="7" fill="url(#flowerGrad)" opacity="0.95" />
                    <ellipse cx="7" cy="2" rx="8" ry="7" fill="url(#flowerGrad)" opacity="0.95" />
                    <ellipse cx="0" cy="6" rx="8" ry="6" fill="url(#flowerGrad)" opacity="0.95" />

                    {/* 황금빛 꽃술 중심핵 */}
                    <circle cx="0" cy="0" r="6" fill="url(#goldGrad)" />
                    <circle cx="0" cy="0" r="3.5" fill="#D97706" />
                    <circle cx="0" cy="0" r="1.8" fill="#FEF08A" />

                    {/* 섬세한 꽃술 하이라이트 점 */}
                    <circle cx="-3.2" cy="-3.2" r="0.9" fill="#FFFBEB" />
                    <circle cx="3.2" cy="-3.2" r="0.9" fill="#FFFBEB" />
                    <circle cx="-3.2" cy="3.2" r="0.9" fill="#FFFBEB" />
                    <circle cx="3.2" cy="3.2" r="0.9" fill="#FFFBEB" />
                  </g>
                </svg>

                <div className="flex items-center gap-1.5 text-xs text-rose-800/80 font-medium tracking-wide mt-1 select-none">
                  <span>🌸</span>
                  <span className="font-serif italic">Grace &amp; Peace</span>
                  <span className="text-rose-400">·</span>
                  <span>은혜와 평강</span>
                  <span>🌸</span>
                </div>
              </div>
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
