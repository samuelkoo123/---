import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Loader2, User, Lock, ArrowLeft, Edit2, AlertTriangle } from "lucide-react";
import * as firebaseService from "../services/firebaseService";

interface AdminPanelProps {
  onExit: () => void;
}

interface ChurchInfo {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminPanel({ onExit }: AdminPanelProps) {
  const [churches, setChurches] = useState<ChurchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<ChurchInfo | null>(null);
  const [formData, setFormData] = useState({ name: "", password: "", confirmPassword: "" });
  const [editData, setEditData] = useState({ name: "", password: "", confirmPassword: "" });

  const fetchChurches = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getAllChurches();
      setChurches(data);
    } catch (err) {
      console.error("Failed to fetch churches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChurches();
  }, []);

  const handleAddChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await firebaseService.addChurch(formData.name, formData.password);
      setShowAddForm(false);
      setFormData({ name: "", password: "", confirmPassword: "" });
      fetchChurches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChurch) return;

    if (editData.password && editData.password !== editData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await firebaseService.updateChurch(selectedChurch.id, {
        name: editData.name,
        password: editData.password || undefined,
      });
      setShowEditForm(false);
      setSelectedChurch(null);
      setEditData({ name: "", password: "", confirmPassword: "" });
      fetchChurches();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChurch = async () => {
    if (!selectedChurch) return;

    setLoading(true);
    try {
      await firebaseService.deleteChurch(selectedChurch.id);
      setShowDeleteConfirm(false);
      setSelectedChurch(null);
      fetchChurches();
    } catch (err) {
      console.error("Delete failed", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F4] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="p-2 hover:bg-white rounded-xl transition-colors text-[#71717A] hover:text-[#1A1A1A]"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">시스템 관리자</h1>
              <p className="text-[#71717A] mt-1">교회 계정을 관리합니다.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 교회 등록
            </button>
          </div>
        </header>

        <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E5E5E5] bg-[#FAFAFA]">
            <h2 className="text-lg font-bold">등록된 교회 목록</h2>
          </div>
          <div className="">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-[#FAFAFA] text-[#71717A] text-xs uppercase tracking-widest font-bold">
                  <th className="px-8 py-4 border-b border-[#E5E5E5] w-1/3">교회 이름</th>
                  <th className="px-8 py-4 border-b border-[#E5E5E5] w-1/3">등록일</th>
                  <th className="px-8 py-4 border-b border-[#E5E5E5] text-right w-1/3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {churches.map((church) => (
                  <tr key={church.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-8 py-4 font-bold text-[#1A1A1A] truncate whitespace-nowrap">
                      {church.name}
                    </td>
                    <td className="px-8 py-4 text-sm text-[#71717A] whitespace-nowrap">
                      {new Date(church.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedChurch(church);
                          setEditData({ name: church.name, password: "", confirmPassword: "" });
                          setShowEditForm(true);
                          setError("");
                        }}
                        className="p-2 text-[#71717A] hover:text-[#1A1A1A] transition-colors"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChurch(church);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-[#71717A] hover:text-rose-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {churches.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-[#71717A]">
                      등록된 교회가 없습니다.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-[#71717A]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5E5E5]"
          >
            <div className="p-8 bg-[#1A1A1A] text-white text-center">
              <h3 className="text-xl font-bold">새 교회 등록</h3>
              <p className="text-white/60 text-sm mt-1">새로운 교회 계정을 생성합니다.</p>
            </div>
            <form onSubmit={handleAddChurch} className="p-8 space-y-4">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">교회 이름</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">비밀번호 확인</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                    <input
                      required
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 bg-[#F4F4F5] text-[#71717A] font-bold rounded-xl hover:bg-[#E5E5E5]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-[#1A1A1A] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "등록하기"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEditForm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5E5E5]"
          >
            <div className="p-8 bg-[#1A1A1A] text-white text-center">
              <h3 className="text-xl font-bold">교회 정보 수정</h3>
              <p className="text-white/60 text-sm mt-1">교회 이름 및 비밀번호를 변경합니다.</p>
            </div>
            <form onSubmit={handleEditChurch} className="p-8 space-y-4">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">교회 이름</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                    <input
                      required
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">새 비밀번호 (변경 시에만 입력)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                    <input
                      type="password"
                      placeholder="변경하지 않으려면 비워두세요"
                      value={editData.password}
                      onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                </div>
                {editData.password && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">비밀번호 확인</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                      <input
                        required
                        type="password"
                        value={editData.confirmPassword}
                        onChange={(e) => setEditData({ ...editData, confirmPassword: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 py-3 bg-[#F4F4F5] text-[#71717A] font-bold rounded-xl hover:bg-[#E5E5E5]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 bg-[#1A1A1A] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "수정하기"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showDeleteConfirm && selectedChurch && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E5E5E5]"
          >
            <div className="p-8 bg-rose-600 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">교회 계정 삭제</h3>
              <p className="text-white/80 text-sm mt-1">정말로 이 교회를 삭제하시겠습니까?</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-rose-600 text-sm text-center font-medium">
                  <strong>{selectedChurch.name}</strong>의 모든 데이터와 데이터베이스 파일이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-[#F4F4F5] text-[#71717A] font-bold rounded-xl hover:bg-[#E5E5E5]"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteChurch}
                  disabled={loading}
                  className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "삭제하기"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
