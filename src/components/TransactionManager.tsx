import React, { useEffect, useState } from "react";
import { Plus, Search, ArrowUpRight, ArrowDownRight, Tag, Calendar, FileText, Edit2, Trash2, ArrowUpDown, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as firebaseService from "../services/firebaseService";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description: string;
  memberId?: string;
  memberName?: string;
  createdAt?: any;
}

interface Member {
  id: string;
  name: string;
}

const categories = {
  income: ["십일조", "감사헌금", "주일헌금", "선교헌금", "건축헌금", "구제헌금", "절기헌금", "기타헌금", "이자 수입", "기타 수입", "전기 이월금"],
  expense: ["사례비", "제수당", "상여금", "퇴직금", "4대보험", "식대", "도서구입", "차량유지비", "심방비", "교육비", "행사비", "선교후원", "구제비", "임대료", "수선비", "비품구입", "전기요금", "수도요금", "가스요금", "통신비", "소모품비", "기타"],
};

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    category: "사례비",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    memberId: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const churchInfo = JSON.parse(sessionStorage.getItem("church_info") || "{}");
  const churchId = churchInfo.id;

  const fetchTransactions = async () => {
    if (!churchId) return;
    try {
      const data = await firebaseService.getTransactions(churchId);
      setTransactions(data as any);
    } catch (error) {
      console.error("Fetch transactions error:", error);
    }
  };

  const fetchMembers = async () => {
    if (!churchId) return;
    try {
      const data = await firebaseService.getMembers(churchId);
      setMembers(data as any);
    } catch (error) {
      console.error("Fetch members error:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMembers();
  }, [churchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setLoading(true);

    try {
      const payload = {
        type: formData.type,
        category: formData.category,
        amount: parseInt(formData.amount),
        date: formData.date,
        description: formData.description,
        memberId: formData.memberId || null,
      };

      if (editingTransaction) {
        await firebaseService.updateTransaction(churchId, editingTransaction.id, payload);
      } else {
        await firebaseService.addTransaction(churchId, payload);
      }
      
      await fetchTransactions();
      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormData({
        type: "expense",
        category: "사례비",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        memberId: "",
      });
    } catch (error) {
      console.error("Submit transaction error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      date: transaction.date,
      description: transaction.description || "",
      memberId: transaction.memberId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete || !churchId) return;

    try {
      await firebaseService.deleteTransaction(churchId, transactionToDelete.id);
      fetchTransactions();
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (err) {
      console.error("Delete transaction error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredTransactions = transactions
    .filter((t) =>
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      
      // If dates are the same, sort by createdAt (time of entry)
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">입출금 관리</h2>
          <p className="text-[#71717A] mt-1">교회의 모든 수입과 지출 내역을 투명하게 관리합니다.</p>
        </div>
        <button
          onClick={() => {
            setEditingTransaction(null);
            setFormData({
              type: "expense",
              category: "사례비",
              amount: "",
              date: new Date().toISOString().split("T")[0],
              description: "",
              memberId: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-black transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          내역 추가
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-[#E5E5E5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E5E5] flex flex-col md:flex-row md:items-end gap-6 bg-[#FAFAFA]">
          <div className="relative flex-1 max-w-md">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#71717A] mb-2">내역 검색</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
              <input
                type="text"
                placeholder="카테고리 또는 내용 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10 transition-all"
              />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#71717A] mb-2">정렬 순서</label>
            <div className="flex bg-white p-1 rounded-xl border border-[#E5E5E5]">
              <button
                onClick={() => setSortOrder("asc")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  sortOrder === "asc" ? "bg-[#1A1A1A] text-white shadow-sm" : "text-[#71717A] hover:bg-black/5"
                }`}
              >
                오름차순
              </button>
              <button
                onClick={() => setSortOrder("desc")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  sortOrder === "desc" ? "bg-[#1A1A1A] text-white shadow-sm" : "text-[#71717A] hover:bg-black/5"
                }`}
              >
                내림차순
              </button>
            </div>
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
                <th className="px-8 py-4 border-b border-[#E5E5E5]">구분</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5]">카테고리</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5]">금액</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5]">내용</th>
                <th className="px-8 py-4 border-b border-[#E5E5E5] text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-8 py-5 text-sm text-[#71717A]">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 opacity-40" />
                      {transaction.date}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      transaction.type === "income" 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "bg-rose-50 text-rose-600"
                    }`}>
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {transaction.type === "income" ? "수입" : "지출"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#F4F4F5] text-[#1A1A1A] w-fit">
                        <Tag className="w-3 h-3 mr-1 opacity-50" />
                        {transaction.category}
                      </span>
                      {transaction.memberName && (
                        <span className="text-[10px] text-[#71717A] mt-1 font-medium ml-1">교인: {transaction.memberName}</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-8 py-5 font-bold ${
                    transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {transaction.type === "income" ? "+" : "-"}₩{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-sm text-[#71717A]">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 opacity-40" />
                      {transaction.description || "-"}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2 transition-opacity">
                      <button
                        onClick={() => handleEdit(transaction)}
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
                          setTransactionToDelete(transaction);
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
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#E5E5E5] bg-[#FAFAFA]">
                <h3 className="text-xl font-bold">{editingTransaction ? "입출금 내역 수정" : "입출금 내역 추가"}</h3>
                <p className="text-[#71717A] text-xs mt-1">수입 또는 지출 내역을 입력해 주세요.</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 p-1 bg-[#F4F4F5] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "income", category: categories.income[0] })}
                      className={`py-2 text-sm font-bold rounded-lg transition-all ${
                        formData.type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-[#71717A]"
                      }`}
                    >
                      수입
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "expense", category: categories.expense[0] })}
                      className={`py-2 text-sm font-bold rounded-lg transition-all ${
                        formData.type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-[#71717A]"
                      }`}
                    >
                      지출
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">카테고리</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    >
                      {categories[formData.type].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {formData.type === "income" && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">교인 선택 (선택사항)</label>
                      <select
                        value={formData.memberId}
                        onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                        className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                      >
                        <option value="">무명/기타</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">날짜</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">금액 (₩)</label>
                    <input
                      required
                      type="number"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">내용</label>
                    <textarea
                      placeholder="상세내역..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    disabled={loading}
                    className="px-8 py-3 bg-[#1A1A1A] text-white text-sm font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "저장 중..." : "저장하기"}
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
              <span className="font-bold text-[#1A1A1A]">[{transactionToDelete?.category}]</span> - <span className="font-bold text-[#1A1A1A]">[{transactionToDelete?.description}]</span> 내역을 삭제하시겠습니까?<br />
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
