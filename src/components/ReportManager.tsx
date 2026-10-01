import React, { useState, useEffect } from "react";
import { FileText, Download, Printer, Calendar, User, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import * as firebaseService from "../services/firebaseService";

interface Member {
  id: string;
  name: string;
  phone: string;
  address: string;
  birthDate?: string;
}

interface ReportManagerProps {
  church: any;
}

export default function ReportManager({ church }: ReportManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [receiptData, setReceiptData] = useState<any>(null);
  const [cashBookData, setCashBookData] = useState<any>(null);
  const [cashBookRange, setCashBookRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [cashBookSortOrder, setCashBookSortOrder] = useState<'asc' | 'desc'>('asc');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    end: new Date().toLocaleDateString('en-CA'),
  });

  const churchInfo = JSON.parse(sessionStorage.getItem("church_info") || "{}");
  const churchId = churchInfo.id;

  useEffect(() => {
    if (churchId) {
      firebaseService.getMembers(churchId).then(setMembers);
    }
  }, [churchId]);

  const fetchSummary = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const data = await firebaseService.getSummaryReport(churchId, dateRange.start, dateRange.end);
      setSummaryData(data);
    } catch (error) {
      console.error("Fetch summary error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipt = async () => {
    if (!selectedMember || !churchId) return;
    setLoading(true);
    try {
      const data = await firebaseService.getDonationReceipt(churchId, selectedMember, year);
      setReceiptData(data);
    } catch (error) {
      console.error("Fetch receipt error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashBook = async () => {
    if (!churchId) return;
    setLoading(true);
    try {
      const data = await firebaseService.getCashBookData(churchId, cashBookRange.start, cashBookRange.end);
      setCashBookData(data);
    } catch (error) {
      console.error("Fetch cash book error:", error);
    } finally {
      setLoading(false);
    }
  };

  const setPresetRange = (type: 'week' | 'month' | 'quarter' | 'year', target: 'summary' | 'cashbook' = 'summary') => {
    const end = new Date();
    const start = new Date();
    
    switch (type) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    
    const range = {
      start: start.toLocaleDateString('en-CA'),
      end: end.toLocaleDateString('en-CA')
    };

    if (target === 'summary') {
      setDateRange(range);
    } else {
      setCashBookRange(range);
    }
  };

  const handlePrintCashBook = () => {
    if (!cashBookData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let runningBalance = cashBookData.initialBalance;
    const entriesWithBalance = cashBookData.entries.map((entry: any) => {
      runningBalance += (entry.income - entry.expense);
      return { ...entry, balance: runningBalance };
    });

    const displayEntries = cashBookSortOrder === 'asc' 
      ? entriesWithBalance 
      : [...entriesWithBalance].reverse();

    const rows = displayEntries.map((entry: any) => {
      return `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.description}</td>
          <td class="amount">${entry.income > 0 ? entry.income.toLocaleString() : '-'}</td>
          <td class="amount">${entry.expense > 0 ? entry.expense.toLocaleString() : '-'}</td>
          <td class="amount">${entry.balance.toLocaleString()}</td>
          <td>${entry.remarks}</td>
        </tr>
      `;
    }).join("");

    const html = `
      <html>
        <head>
          <title>현금 출납부 - ${church.name}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; color: #333; line-height: 1.2; font-size: 11px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .period { font-size: 11px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
            .amount { text-align: right; font-family: monospace; }
            .summary { margin-top: 15px; text-align: right; font-size: 14px; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">현금 출납부 (Cash Book)</div>
            <div class="church-name">${church.name}</div>
            <div class="period">기간: ${cashBookRange.start} ~ ${cashBookRange.end}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 100px;">날짜</th>
                <th>적요 (내역)</th>
                <th style="width: 100px;">수입 (In)</th>
                <th style="width: 100px;">지출 (Out)</th>
                <th style="width: 100px;">잔액 (Balance)</th>
                <th style="width: 150px;">비고 (결제수단/증빙)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">-</td>
                <td style="font-weight: bold;">전기 이월금 (Brought Forward)</td>
                <td class="amount">-</td>
                <td class="amount">-</td>
                <td class="amount">${cashBookData.initialBalance.toLocaleString()}</td>
                <td style="text-align: center;">-</td>
              </tr>
              ${rows}
            </tbody>
          </table>
          <div class="summary">
            기말 잔액 (Closing Balance): ₩${runningBalance.toLocaleString()}
          </div>
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 8px 16px; background: #1a1a1a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">인쇄하기</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintSummary = () => {
    if (!summaryData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalIncome = summaryData.otherIncomes.reduce((sum: number, i: any) => sum + i.total, 0);
    const totalExpense = summaryData.expenses.reduce((sum: number, e: any) => sum + e.total, 0);

    const html = `
      <html>
        <head>
          <title>재정 보고서 - ${church.name}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Malgun Gothic', sans-serif; padding: 0; color: #333; line-height: 1.4; font-size: 13px; }
            .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .period { font-size: 12px; color: #666; }
            .section { margin-bottom: 20px; page-break-inside: avoid; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-left: 4px solid #333; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background-color: #f9f9f9; font-size: 12px; }
            .amount { text-align: right; font-family: monospace; }
            .total-row { font-weight: bold; background-color: #f0f0f0; }
            .summary-box { margin-top: 25px; padding: 15px; border: 2px solid #333; border-radius: 8px; page-break-inside: avoid; }
            .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .net { font-size: 18px; font-weight: bold; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${church.name} 재정 요약 보고서</div>
            <div class="period">기간: ${dateRange.start} ~ ${dateRange.end}</div>
          </div>

          ${summaryData.otherIncomes.length > 0 ? `
          <div class="section">
            <div class="section-title">수입 내역</div>
            <table>
              <thead>
                <tr>
                  <th>항목</th>
                  <th class="amount">금액</th>
                </tr>
              </thead>
              <tbody>
                ${summaryData.otherIncomes.map((i: any) => `
                  <tr>
                    <td>${i.category}</td>
                    <td class="amount">₩${i.total.toLocaleString()}</td>
                  </tr>
                `).join("")}
                <tr class="total-row">
                  <td>수입 합계</td>
                  <td class="amount">₩${totalIncome.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ""}

          <div class="section">
            <div class="section-title">지출 내역</div>
            <table>
              <thead>
                <tr>
                  <th>항목</th>
                  <th class="amount">금액</th>
                </tr>
              </thead>
              <tbody>
                ${summaryData.expenses.map((e: any) => `
                  <tr>
                    <td>${e.category}</td>
                    <td class="amount">₩${e.total.toLocaleString()}</td>
                  </tr>
                `).join("")}
                <tr class="total-row">
                  <td>지출 합계</td>
                  <td class="amount">₩${totalExpense.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="summary-box">
            <div class="summary-item">
              <span>총 수입</span>
              <span>₩${totalIncome.toLocaleString()}</span>
            </div>
            <div class="summary-item">
              <span>총 지출</span>
              <span>- ₩${totalExpense.toLocaleString()}</span>
            </div>
            <div class="summary-item net">
              <span>잔액 (순이익)</span>
              <span>₩${(totalIncome - totalExpense).toLocaleString()}</span>
            </div>
          </div>

          <div style="margin-top: 60px; text-align: center;">
            <p>위와 같이 재정 보고를 드립니다.</p>
            <p style="margin-top: 40px; font-size: 18px; font-weight: bold;">${new Date().toLocaleDateString()}</p>
            <p style="margin-top: 20px; font-size: 22px; font-weight: bold;">${church.name}</p>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintReceipt = () => {
    if (!receiptData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalAmount = receiptData.offerings.reduce((sum: number, o: any) => sum + o.total, 0);

    const numberToKorean = (num: number) => {
      const units = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
      const groupUnits = ["", "만", "억", "조"];
      const digitUnits = ["", "십", "백", "천"];
      
      if (num === 0) return "영";
      
      let result = "";
      let groupCount = 0;
      let tempNum = num;
      
      while (tempNum > 0) {
        let group = tempNum % 10000;
        let groupResult = "";
        
        for (let i = 0; i < 4; i++) {
          let digit = group % 10;
          if (digit > 0) {
            let digitStr = (i === 0 && digit === 1 && group > 1) ? "" : units[digit];
            if (i > 0 && digit === 1) digitStr = "";
            groupResult = digitStr + digitUnits[i] + groupResult;
          }
          group = Math.floor(group / 10);
        }
        
        if (groupResult !== "") {
          result = groupResult + groupUnits[groupCount] + result;
        }
        
        tempNum = Math.floor(tempNum / 10000);
        groupCount++;
      }
      
      return result;
    };

    const amountInWords = numberToKorean(totalAmount);

    const html = `
      <html>
        <head>
          <title>기부금 영수증 - ${receiptData.member.name}</title>
          <style>
            body { font-family: 'Malgun Gothic', sans-serif; padding: 60px; color: #333; line-height: 1.6; }
            .receipt-container { border: 4px double #333; padding: 40px; position: relative; }
            .header { text-align: center; margin-bottom: 50px; }
            .title { font-size: 32px; font-weight: 900; letter-spacing: 10px; text-decoration: underline; }
            .serial { position: absolute; top: 20px; right: 20px; font-size: 12px; }
            
            table.info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            table.info-table th, table.info-table td { border: 1px solid #333; padding: 12px; }
            table.info-table th { width: 20%; background-color: #f5f5f5; text-align: center; font-weight: bold; }
            table.info-table td { text-align: left; }

            .amount-section { font-size: 20px; font-weight: bold; text-align: center; margin: 40px 0; padding: 20px; border: 1px solid #333; background-color: #fcfcfc; }
            
            table.detail-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            table.detail-table th, table.detail-table td { border: 1px solid #333; padding: 10px; text-align: center; }
            table.detail-table th { background-color: #f5f5f5; }

            .footer { text-align: center; margin-top: 60px; }
            .church-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .stamp { display: inline-block; width: 40px; height: 40px; border: 2px solid red; color: red; border-radius: 50%; line-height: 40px; font-size: 14px; font-weight: bold; transform: rotate(-15deg); margin-left: 15px; vertical-align: middle; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="serial">제 ${new Date().getFullYear()}-${receiptData.member.id.toString().padStart(4, '0')} 호</div>
            <div class="header">
              <div class="title">기부금 영수증</div>
            </div>

            <table class="info-table">
              <tr>
                <th>성 명</th>
                <td>${receiptData.member.name}</td>
                <th>생년월일</th>
                <td>${receiptData.member.birthDate || "-"}</td>
              </tr>
              <tr>
                <th>주 소</th>
                <td colspan="3">${receiptData.member.address || "-"}</td>
              </tr>
            </table>

            <div class="amount-section">
              금 액 : ₩ ${totalAmount.toLocaleString()} 원 정 (일금 ${amountInWords}원정)
            </div>

            <table class="detail-table">
              <thead>
                <tr>
                  <th>기부 항목</th>
                  <th>금 액</th>
                  <th>비 고</th>
                </tr>
              </thead>
              <tbody>
                ${receiptData.offerings.map((o: any) => `
                  <tr>
                    <td>${o.type}</td>
                    <td>₩${o.total.toLocaleString()}</td>
                    <td>${receiptData.year}년도 합계</td>
                  </tr>
                `).join("")}
                <tr style="font-weight: bold; background-color: #f9f9f9;">
                  <td>총 합계</td>
                  <td>₩${totalAmount.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div style="margin: 40px 0; text-align: center;">
              <p>위 금액을 ${receiptData.year}년도 기부금으로 정히 영수함.</p>
            </div>

            <div class="footer">
              <p style="font-size: 18px; margin-bottom: 30px;">${new Date().toLocaleDateString()}</p>
              <div class="church-name">
                ${church.name} 대표자
                <div class="stamp">인</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">보고서 및 기부금 영수증</h2>
        <p className="text-[#71717A] mt-1">재정 보고서 생성 및 교인별 기부금 영수증을 발행합니다.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Cash Book Section */}
        <section className="space-y-6 lg:col-span-2">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">기간별 현금 출납부</h3>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">기간 프리셋</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setPresetRange('week', 'cashbook')}
                    className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                  >
                    한 주간
                  </button>
                  <button
                    onClick={() => setPresetRange('month', 'cashbook')}
                    className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                  >
                    월 별
                  </button>
                  <button
                    onClick={() => setPresetRange('quarter', 'cashbook')}
                    className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                  >
                    분기 별
                  </button>
                  <button
                    onClick={() => setPresetRange('year', 'cashbook')}
                    className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                  >
                    년 별
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">시작일</label>
                  <input
                    type="date"
                    value={cashBookRange.start}
                    onChange={(e) => setCashBookRange({ ...cashBookRange, start: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">종료일</label>
                  <input
                    type="date"
                    value={cashBookRange.end}
                    onChange={(e) => setCashBookRange({ ...cashBookRange, end: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">정렬 순서</label>
                <div className="flex bg-[#F9FAFB] p-1 rounded-xl border border-[#E5E5E5]">
                  <button
                    onClick={() => setCashBookSortOrder('asc')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${cashBookSortOrder === 'asc' ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-[#71717A] hover:bg-black/5'}`}
                  >
                    오름차순
                  </button>
                  <button
                    onClick={() => setCashBookSortOrder('desc')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${cashBookSortOrder === 'desc' ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-[#71717A] hover:bg-black/5'}`}
                  >
                    내림차순
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={fetchCashBook}
              className="w-full py-4 bg-[#1A1A1A] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all flex items-center justify-center"
            >
              현금 출납부 데이터 조회
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>

            {cashBookData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-[#E5E5E5] space-y-6"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E5E5]">
                        <th className="py-3 px-2 text-left font-bold text-[#71717A]">날짜</th>
                        <th className="py-3 px-2 text-left font-bold text-[#71717A]">적요 (내역)</th>
                        <th className="py-3 px-2 text-right font-bold text-[#71717A]">수입</th>
                        <th className="py-3 px-2 text-right font-bold text-[#71717A]">지출</th>
                        <th className="py-3 px-2 text-right font-bold text-[#71717A]">잔액</th>
                        <th className="py-3 px-2 text-right font-bold text-[#71717A]">비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#F9FAFB] bg-[#F9FAFB]/50">
                        <td className="py-3 px-2 text-[#71717A]">-</td>
                        <td className="py-3 px-2 font-bold">전기 이월금</td>
                        <td className="py-3 px-2 text-right">-</td>
                        <td className="py-3 px-2 text-right">-</td>
                        <td className="py-3 px-2 text-right text-emerald-600 font-bold">₩{cashBookData.initialBalance.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">-</td>
                      </tr>
                      {(() => {
                        let runningBalance = cashBookData.initialBalance;
                        const entriesWithBalance = cashBookData.entries.map((entry: any) => {
                          runningBalance += (entry.income - entry.expense);
                          return { ...entry, balance: runningBalance };
                        });

                        const displayEntries = cashBookSortOrder === 'asc' 
                          ? entriesWithBalance 
                          : [...entriesWithBalance].reverse();

                        return displayEntries.slice(0, 5).map((entry: any, idx: number) => {
                          return (
                            <tr key={idx} className="border-b border-[#F9FAFB]">
                              <td className="py-3 px-2 text-xs text-[#71717A]">{entry.date}</td>
                              <td className="py-3 px-2">{entry.description}</td>
                              <td className="py-3 px-2 text-right text-emerald-600 font-medium">
                                {entry.income > 0 ? `₩${entry.income.toLocaleString()}` : '-'}
                              </td>
                              <td className="py-3 px-2 text-right text-rose-600 font-medium">
                                {entry.expense > 0 ? `₩${entry.expense.toLocaleString()}` : '-'}
                              </td>
                              <td className="py-3 px-2 text-right font-bold">
                                ₩{entry.balance.toLocaleString()}
                              </td>
                              <td className="py-3 px-2 text-right text-xs text-[#71717A]">{entry.remarks}</td>
                            </tr>
                          );
                        });
                      })()}
                      {cashBookData.entries.length > 5 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-[#71717A] italic">
                            외 {cashBookData.entries.length - 5}건의 내역이 더 있습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button 
                  onClick={handlePrintCashBook}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-all flex items-center justify-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  현금 출납부 인쇄하기
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Summary Report Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">기간별 재정 요약</h3>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-sm space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">기간 프리셋</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setPresetRange('week')}
                  className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                >
                  한 주간
                </button>
                <button
                  onClick={() => setPresetRange('month')}
                  className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                >
                  월 별
                </button>
                <button
                  onClick={() => setPresetRange('quarter')}
                  className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                >
                  분기 별
                </button>
                <button
                  onClick={() => setPresetRange('year')}
                  className="py-2 px-1 text-[10px] font-bold border border-[#E5E5E5] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                >
                  년 별
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">시작일</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">종료일</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                />
              </div>
            </div>
            <button
              onClick={fetchSummary}
              className="w-full py-4 bg-[#1A1A1A] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all flex items-center justify-center"
            >
              보고서 생성하기
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>

            {summaryData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-[#E5E5E5] space-y-6"
              >
                {summaryData.otherIncomes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-[#71717A] uppercase tracking-widest mb-4">수입 요약</h4>
                    <div className="space-y-2">
                      {summaryData.otherIncomes.map((i: any) => (
                        <div key={i.category} className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-lg">
                          <span className="text-sm font-medium">{i.category}</span>
                          <span className="font-bold text-emerald-600">₩{i.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-[#71717A] uppercase tracking-widest mb-4">지출 요약</h4>
                  <div className="space-y-2">
                    {summaryData.expenses.map((e: any) => (
                      <div key={e.category} className="flex justify-between items-center p-3 bg-[#F9FAFB] rounded-lg">
                        <span className="text-sm font-medium">{e.category}</span>
                        <span className="font-bold text-rose-600">₩{e.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handlePrintSummary}
                  className="w-full py-3 border border-[#E5E5E5] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#F9FAFB] transition-all flex items-center justify-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  보고서 인쇄
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Donation Receipt Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">기부금 영수증 발행</h3>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">교인 선택</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                >
                  <option value="">교인 선택...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#71717A]">연도</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9FAFB] border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                >
                  {[2024, 2025, 2026].map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={fetchReceipt}
              disabled={!selectedMember}
              className="w-full py-4 bg-[#1A1A1A] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              영수증 데이터 조회
              <Download className="w-4 h-4 ml-2" />
            </button>

            {receiptData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-6 border-t border-[#E5E5E5]"
              >
                <div className="p-6 bg-[#F9FAFB] border border-[#E5E5E5] rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-lg font-bold">{receiptData.member.name}</h5>
                      <p className="text-xs text-[#71717A]">{receiptData.member.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#71717A] uppercase tracking-widest">Year</p>
                      <p className="text-lg font-bold">{receiptData.year}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {receiptData.offerings.map((o: any) => (
                      <div key={o.type} className="flex justify-between text-sm">
                        <span className="text-[#71717A]">{o.type}</span>
                        <span className="font-bold">₩{o.total.toLocaleString()}</span>
                      </div>
                    ))}
                  <div className="pt-2 border-t border-[#E5E5E5] flex justify-between font-bold text-xl text-emerald-600">
                    <span>총 합계</span>
                    <span>₩{receiptData.offerings.reduce((sum: number, o: any) => sum + o.total, 0).toLocaleString()}</span>
                  </div>
                  </div>
                </div>
                <button 
                  onClick={handlePrintReceipt}
                  className="w-full mt-4 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-all flex items-center justify-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  기부금 영수증 출력
                </button>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
