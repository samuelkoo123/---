import React, { useEffect, useState } from "react";
import { Plus, Search, Heart, User, Calendar, DollarSign, Tag, Edit2, Trash2, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as firebaseService from "../services/firebaseService";

interface Offering {
  id: string;
  memberId: string | null;
  memberName: string;
  type: string;
  amount: number;
  date: string;
  notes: string;
  createdAt?: any;
}

interface Member {
  id: string;
  name: string;
}

const offeringTypes = ["십일조", "감사헌금", "주일헌금", "건축헌금", "선교헌금", "기타"];

export default function OfferingManager() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    type: "십일조",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [offeringToDelete, setOfferingToDelete] = useState<Offering | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const churchInfo = JSON.parse(sessionStorage.getItem("church_info") || "{}");
  const churchId = churchInfo.id;

  const fetchData = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const [offeringsData, membersData] = await Promise.all([
        firebaseService.getOfferings(churchId),
        firebaseService.getMembers(churchId)
      ]);
      setOfferings(offeringsData);
      setMembers(membersData);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [churchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setLoading(true);

    try {
      const data = {
        memberId: formData.memberId || null,
        type: formData.type,
        amount: parseInt(formData.amount),
        date: formData.date,
        notes: formData.notes,
      };

      if (editingOffering) {
        await firebaseService.updateOffering(churchId, editingOffering.id, data);
      } else {
        await firebaseService.addOffering(churchId, data);
      }

      fetchData();
      setIsModalOpen(false);
      setEditingOffering(null);
      setFormData({
        memberId: "",
        type: "십일조",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch (error) {
      console.error("Submit offering error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offering: Offering) => {
    setEditingOffering(offering);
    setFormData({
      memberId: offering.memberId || "",
      type: offering.type,
      amount: offering.amount.toString(),
      date: offering.date,
      notes: offering.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!offeringToDelete || !churchId) return;
    setLoading(true);

    try {
      await firebaseService.deleteOffering(churchId, offeringToDelete.id);
      fetchData();
      setIsDeleteModalOpen(false);
      setOfferingToDelete(null);
    } catch (err) {
      console.error("Delete offering error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOfferings = offerings
    .filter((o) =>
      (o.memberName || "무명").toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.type.includes(searchTerm)
    )
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">헌금 관리</h2>
          <p className="text-[#71717A] mt-1">교인들의 정성 어린 헌금을 기록하고 관리합니다.</p>
        </div>
        <button
          onClick={() => {
            setEditingOffering(null);
            setFormData({
              member_id: "",
              type: "십일조",
              amount: "",
              date: new Date().toISOString().split("T")[0],
              notes: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          헌금 기록 추가
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E5E5] flex items-center bg-[#FAFAFA]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="교인 이름 또는 헌금 종류 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#71717A] text-xs uppercase tracking-widest font-bold">
                <th 
                  className="px-8 py-4 border-b border-[#E5E5E5] cursor-pointer hover:bg-[#F4F4F5] transition-colors group/sort"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  <div className="flex items-center">
                    날짜
                    <div className="ml-2">
                      {sortOrder === "asc" ? (
                        <ChevronUp className="w-4 h-4 text-[#1A1A1A]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#1A1A1A]" />
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-8 py-4 border-b border-[#E5E5E5]">교인명</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5]">헌금 종류</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5]">금액</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5]">비고</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5] text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredOfferings.map((offering) => (
                <tr key={offering.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-8 py-5 text-sm text-[#71717A]">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 opacity-40" />
                      {offering.date}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center text-xs font-bold text-[#1A1A1A] mr-3">
                        {(offering.memberName || "무")[0]}
                      </div>
                      <span className="font-bold text-[#1A1A1A]">{offering.memberName || "무명"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#F4F4F5] text-[#1A1A1A]">
                      <Tag className="w-3 h-3 mr-1 opacity-50" />
                      {offering.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-[#1A1A1A]">₩{offering.amount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-sm text-[#71717A] italic">{offering.notes || "-"}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2 transition-opacity">
                      <button
                        onClick={() => handleEdit(offering)}
                        className="p-2 text-[#71717A] hover:text-[#1A1A1A] hover:bg-[#F4F4F5] rounded-lg border border-[#E5E5E5] md:border-transparent md:hover:border-[#F4F4F5] transition-all"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOfferingToDelete(offering);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex items-center gap-1 p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition-all"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-bold">삭제</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E5E5E5] bg-[#FAFAFA]">
                <h3 className="text-xl font-bold">{editingOffering ? "헌금 기록 수정" : "헌금 기록 추가"}</h3>
                <p className="text-[#71717A] text-xs mt-1">헌금 내역을 정확하게 입력해 주세요.</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">교인 선택</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                      <select
                        value={formData.memberId}
                        onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none"
                      >
                        <option value="">무명 (선택 안함)</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">헌금 종류</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                      >
                        {offeringTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">날짜</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">금액 (₩)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                      <input
                        required
                        type="number"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">비고</label>
                    <textarea
                      placeholder="추가 메모..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 text-sm font-bold text-[#71717A] hover:bg-[#F4F4F5] rounded-xl transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#1A1A1A] text-white text-sm font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all"
                  >
                    저장하기
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">정말 삭제하시겠습니까?</h3>
            <p className="text-[#71717A] text-sm mb-8 leading-relaxed">
              <span className="font-bold text-[#1A1A1A]">[{offeringToDelete?.memberName || "무명"}]</span> 님의 <span className="font-bold text-[#1A1A1A]">[{offeringToDelete?.type}]</span> 기록을 삭제하시겠습니까?<br />
              삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                네, 삭제하겠습니다
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-4 bg-[#F4F4F5] text-[#71717A] font-bold rounded-2xl hover:bg-[#E5E5E5] transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
