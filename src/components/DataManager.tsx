import React, { useState, useRef } from "react";
import { Download, FileJson, FileSpreadsheet, Database, Loader2, CheckCircle2, Upload, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import * as firebaseService from "../services/firebaseService";

export default function DataManager() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const churchInfo = JSON.parse(sessionStorage.getItem("church_info") || "{}");
  const churchId = churchInfo.id;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreType, setRestoreType] = useState<"members" | "offerings" | "transactions" | null>(null);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const convertToCSV = (objArray: any[]) => {
    if (objArray.length === 0) return "";
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '\uFEFF'; // BOM for Excel UTF-8 support
    
    // Header
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';

    // Rows
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const index in array[i]) {
        if (line !== '') line += ',';
        
        let value = array[i][index];
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n')) {
            value = `"${value}"`;
          }
        }
        line += value;
      }
      str += line + '\r\n';
    }
    return str;
  };

  const handleExport = async (type: "members" | "offerings" | "transactions", format: "json" | "csv") => {
    if (!churchId) return;
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      let data: any[] = [];
      let fileName = `${type}_${new Date().toISOString().split('T')[0]}`;

      if (type === "members") {
        data = await firebaseService.getMembers(churchId);
      } else if (type === "offerings") {
        data = await firebaseService.getOfferings(churchId);
      } else if (type === "transactions") {
        data = await firebaseService.getTransactions(churchId);
      }

      if (format === "json") {
        downloadFile(JSON.stringify(data, null, 2), `${fileName}.json`, "application/json");
      } else {
        const csv = convertToCSV(data);
        downloadFile(csv, `${fileName}.csv`, "text/csv;charset=utf-8;");
      }

      setSuccess(`${type === 'members' ? '교인' : type === 'offerings' ? '헌금' : '입출금'} 자료가 성공적으로 다운로드되었습니다.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setError("자료 추출 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (type: "members" | "offerings" | "transactions") => {
    setRestoreType(type);
    fileInputRef.current?.click();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restoreType || !churchId) return;

    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          if (!Array.isArray(data)) {
            throw new Error("올바른 JSON 배열 형식이 아닙니다.");
          }

          await firebaseService.restoreData(churchId, restoreType, data);
          
          setSuccess(`${restoreType === 'members' ? '교인' : restoreType === 'offerings' ? '헌금' : '입출금'} 자료가 성공적으로 복구되었습니다.`);
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          console.error("Restore parse error:", err);
          setError("파일 형식이 올바르지 않습니다. JSON 백업 파일을 사용해 주세요.");
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error("Restore error:", err);
      setError("자료 복구 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">데이터 관리</h2>
        <p className="text-[#71717A] mt-1">교회의 데이터를 백업하거나 이전 데이터를 복구할 수 있습니다.</p>
      </header>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleRestore} 
        accept=".json" 
        className="hidden" 
      />

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-medium"
        >
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 font-medium"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Section */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Download className="w-5 h-5" />
            데이터 백업 (내보내기)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { id: "members", label: "교인 명부", icon: Database, color: "blue" },
              { id: "transactions", label: "입출금 내역", icon: FileSpreadsheet, color: "rose" }
            ].map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 bg-${item.color}-50 rounded-xl flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A]">{item.label}</h4>
                    <p className="text-xs text-[#71717A]">Excel 또는 JSON 형식</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(item.id as any, "csv")}
                    disabled={loading}
                    className="px-4 py-2 bg-[#F4F4F5] text-[#1A1A1A] text-xs font-bold rounded-lg hover:bg-[#E5E5E5] transition-all"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(item.id as any, "json")}
                    disabled={loading}
                    className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold rounded-lg hover:bg-black transition-all"
                  >
                    JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Restore Section */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Upload className="w-5 h-5" />
            데이터 복구 (가져오기)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { id: "members", label: "교인 명부 복구", icon: Database, color: "blue" },
              { id: "transactions", label: "입출금 내역 복구", icon: FileSpreadsheet, color: "rose" }
            ].map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 bg-${item.color}-50 rounded-xl flex items-center justify-center`}>
                    <Upload className={`w-5 h-5 text-${item.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A]">{item.label}</h4>
                    <p className="text-xs text-[#71717A]">JSON 백업 파일 필요</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFileSelect(item.id as any)}
                  disabled={loading}
                  className="px-6 py-2 border border-[#E5E5E5] text-[#1A1A1A] text-xs font-bold rounded-lg hover:bg-[#F4F4F5] transition-all flex items-center gap-2"
                >
                  <Upload className="w-3 h-3" />
                  파일 선택
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]" />
            <span className="font-bold">데이터를 처리하고 있습니다...</span>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8">
        <h4 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          주의사항
        </h4>
        <ul className="text-amber-800/80 text-sm leading-relaxed list-disc list-inside space-y-1">
          <li>데이터 복구는 <strong>JSON 형식의 백업 파일</strong>만 지원합니다.</li>
          <li>복구 시 기존 데이터는 유지되며, 새로운 데이터가 추가됩니다. (중복 주의)</li>
          <li>대량의 데이터를 복구할 경우 시간이 다소 소요될 수 있습니다.</li>
          <li>중요한 작업 전에는 반드시 현재 데이터를 먼저 백업해 두시기 바랍니다.</li>
        </ul>
      </div>
    </div>
  );
}
