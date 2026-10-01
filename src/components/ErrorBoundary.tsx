import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    const { children } = (this as any).props;
    const state = (this as any).state;
    if (state.hasError) {
      let errorMessage = "알 수 없는 오류가 발생했습니다.";
      let isPermissionError = false;

      try {
        const errorData = JSON.parse(state.error?.message || "{}");
        if (errorData.error?.includes("Missing or insufficient permissions")) {
          errorMessage = "권한이 없습니다. 관리자에게 문의하세요.";
          isPermissionError = true;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        if (state.error?.message.includes("permissions")) {
          errorMessage = "권한이 없습니다. 관리자에게 문의하세요.";
          isPermissionError = true;
        }
      }

      return (
        <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-[#E5E5E5]">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">오류가 발생했습니다</h2>
            <p className="text-[#71717A] mb-8">{errorMessage}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-[#1A1A1A] text-white font-bold rounded-xl shadow-lg shadow-black/10 hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                페이지 새로고침
              </button>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  window.location.href = "/";
                }}
                className="w-full py-4 bg-white text-[#71717A] font-bold rounded-xl border border-[#E5E5E5] hover:bg-[#F9FAFB] transition-all"
              >
                로그아웃 후 다시 시도
              </button>
            </div>

            {isPermissionError && (
              <p className="mt-6 text-xs text-[#A1A1AA]">
                Firebase 보안 규칙이 아직 적용되지 않았거나 권한 설정이 잘못되었을 수 있습니다.
              </p>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
