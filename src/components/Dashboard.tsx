import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Users, Heart, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import * as firebaseService from "../services/firebaseService";

interface Stats {
  totalIncome: number;
  totalExpense: number;
  memberCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const churchInfo = JSON.parse(sessionStorage.getItem("church_info") || "{}");
  const churchId = churchInfo.id;

  useEffect(() => {
    if (!churchId) return;
    
    const fetchStats = async () => {
      try {
        const data = await firebaseService.getStats(churchId);
        setStats(data);
      } catch (error) {
        console.error("Fetch stats error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [churchId]);

  if (loading) return <div className="flex items-center justify-center h-64">로딩 중...</div>;

  const chartData = [
    { name: "수입", value: stats?.totalIncome || 0, color: "#10B981" },
    { name: "지출", value: stats?.totalExpense || 0, color: "#EF4444" },
  ];

  const summaryCards = [
    { label: "총 교인 수", value: stats?.memberCount, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "총 수입액", value: `₩${stats?.totalIncome.toLocaleString()}`, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { label: "총 지출액", value: `₩${stats?.totalExpense.toLocaleString()}`, icon: TrendingDown, color: "bg-rose-50 text-rose-600" },
    { label: "현재 잔액", value: `₩${((stats?.totalIncome || 0) - (stats?.totalExpense || 0)).toLocaleString()}`, icon: Wallet, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">대시보드</h2>
          <p className="text-[#71717A] mt-1">교회 재정 현황을 한눈에 확인하세요.</p>
        </div>
        <div className="text-sm font-medium text-[#71717A] bg-white px-4 py-2 rounded-full border border-[#E5E5E5] shadow-sm">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={card.color + " p-3 rounded-xl"}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +2.5%
              </div>
            </div>
            <p className="text-sm font-medium text-[#71717A] mb-1">{card.label}</p>
            <p className="text-lg font-bold text-[#1A1A1A]">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-sm">
          <h3 className="text-lg font-bold mb-8 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-[#1A1A1A]" />
            재정 흐름 요약
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717A', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-8">수입/지출 비율</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-[#71717A] uppercase tracking-widest font-bold">Balance</span>
                <span className="text-sm font-bold">₩{((stats?.totalIncome || 0) - (stats?.totalExpense || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-[#71717A]">{item.name}</span>
                </div>
                <span className="text-sm font-bold">₩{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
