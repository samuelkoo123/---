import React, { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, Phone, MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as firebaseService from "../services/firebaseService";

interface Member {
  id: string;
  name: string;
  phone: string;
  address: string;
  birthDate: string;
  registrationDate: string;
  createdAt?: any;
}

export default function MemberManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", birthDate: "" });
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<"name" | "registrationDate">("registrationDate");

  const churchInfo = JSON.parse(sessionStorage.getItem("church_info") || "{}");
  const churchId = churchInfo.id;

  const fetchMembers = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const data = await firebaseService.getMembers(churchId);
      setMembers(data as any);
    } catch (error) {
      console.error("Fetch members error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [churchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;

    try {
      if (editingMember) {
        await firebaseService.updateMember(churchId, editingMember.id, formData);
      } else {
        await firebaseService.addMember(churchId, {
          ...formData,
          registrationDate: new Date().toISOString().split('T')[0]
        });
      }
      fetchMembers();
      setIsModalOpen(false);
      setEditingMember(null);
      setFormData({ name: "", phone: "", address: "", birthDate: "" });
    } catch (error) {
      console.error("Submit member error:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete || !churchId) return;

    try {
      await firebaseService.deleteMember(churchId, memberToDelete.id);
      fetchMembers();
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    } catch (err) {
      console.error("Delete member error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredMembers = members
    .filter((m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortField === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else {
        const dateA = new Date(a.registrationDate).getTime();
        const dateB = new Date(b.registrationDate).getTime();
        if (dateA !== dateB) {
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
    });

  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">교인 관리</h2>
          <p className="text-[#71717A] text-sm mt-0.5">교회 식구들의 정보를 관리합니다.</p>
        </div>
        <button
          onClick={() => {
            setEditingMember(null);
            setFormData({ name: "", phone: "", address: "", birth_date: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-5 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 교인 등록
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5] flex items-center bg-[#FAFAFA]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="이름 또는 전화번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#71717A] text-[10px] uppercase tracking-widest font-bold">
                <th 
                  className="px-6 py-3 border-b border-[#E5E5E5] whitespace-nowrap cursor-pointer hover:bg-[#F4F4F5] transition-colors"
                  onClick={() => {
                    if (sortField === "name") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else { setSortField("name"); setSortOrder("asc"); }
                  }}
                >
                  <div className="flex items-center">
                    이름
                    {sortField === "name" && (
                      <div className="ml-1">
                        {sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-[#E5E5E5] whitespace-nowrap">연락처</th>
                <th className="px-6 py-3 border-b border-[#E5E5E5] whitespace-nowrap">주소</th>
                <th className="px-6 py-3 border-b border-[#E5E5E5] whitespace-nowrap">생년월일</th>
                <th 
                  className="px-6 py-3 border-b border-[#E5E5E5] whitespace-nowrap cursor-pointer hover:bg-[#F4F4F5] transition-colors"
                  onClick={() => {
                    if (sortField === "registrationDate") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else { setSortField("registrationDate"); setSortOrder("desc"); }
                  }}
                >
                  <div className="flex items-center">
                    등록일
                    {sortField === "registrationDate" && (
                      <div className="ml-1">
                        {sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </div>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-[#E5E5E5] whitespace-nowrap text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-6 py-3 whitespace-nowrap font-bold text-[#1A1A1A] text-sm">
                    {member.name}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-[#71717A]">
                    {member.phone}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-[#71717A]">
                    {member.address}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-[#71717A]">
                    {member.birthDate || "-"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-[#71717A]">
                    {member.registrationDate}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1.5 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingMember(member);
                          setFormData({ name: member.name, phone: member.phone, address: member.address, birthDate: member.birthDate || "" });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-[#71717A] hover:bg-white hover:text-[#1A1A1A] rounded-lg border border-[#E5E5E5] md:border-transparent md:hover:border-[#E5E5E5] transition-all"
                        title="수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMemberToDelete(member);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex items-center gap-1 p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition-all"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">삭제</span>
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
                <h3 className="text-xl font-bold">{editingMember ? "교인 정보 수정" : "새 교인 등록"}</h3>
                <p className="text-[#71717A] text-xs mt-1">교인의 기본 인적 사항을 입력해 주세요.</p>
              </div>
              {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A1A]"></div></div>}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">이름</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">전화번호</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">주소</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">생년월일</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="relative">
                        <select
                          value={formData.birthDate ? formData.birthDate.split("-")[0] : ""}
                          onChange={(e) => {
                            const parts = (formData.birthDate || "--").split("-");
                            setFormData({ ...formData, birthDate: `${e.target.value}-${parts[1] || "01"}-${parts[2] || "01"}` });
                          }}
                          className="w-full pl-4 pr-8 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none text-sm font-medium"
                        >
                          <option value="">년도</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}년</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A1A1AA]">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="relative">
                        <select
                          value={formData.birthDate ? formData.birthDate.split("-")[1] : ""}
                          onChange={(e) => {
                            const parts = (formData.birthDate || "--").split("-");
                            setFormData({ ...formData, birthDate: `${parts[0] || new Date().getFullYear()}-${e.target.value}-${parts[2] || "01"}` });
                          }}
                          className="w-full pl-4 pr-8 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none text-sm font-medium"
                        >
                          <option value="">월</option>
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}월</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A1A1AA]">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="relative">
                        <select
                          value={formData.birthDate ? formData.birthDate.split("-")[2] : ""}
                          onChange={(e) => {
                            const parts = (formData.birthDate || "--").split("-");
                            setFormData({ ...formData, birthDate: `${parts[0] || new Date().getFullYear()}-${parts[1] || "01"}-${e.target.value}` });
                          }}
                          className="w-full pl-4 pr-8 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 appearance-none text-sm font-medium"
                        >
                          <option value="">일</option>
                          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                            <option key={d} value={d}>{d}일</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#A1A1AA]">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
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
                    {editingMember ? "저장하기" : "등록하기"}
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
              <span className="font-bold text-[#1A1A1A]">[{memberToDelete?.name}]</span> 교인의 정보를 삭제하시겠습니까?<br />
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
