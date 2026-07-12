"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast Portal/Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => {
          let icon = <Info className="h-5 w-5 text-blue-400" />;
          let borderColor = "border-blue-500/30";
          let bgColor = "bg-zinc-900/90";
          let glowColor = "shadow-blue-500/10";
          
          if (toast.type === "success") {
            icon = <CheckCircle className="h-5 w-5 text-emerald-400" />;
            borderColor = "border-emerald-500/30";
            glowColor = "shadow-emerald-500/10";
          } else if (toast.type === "error") {
            icon = <AlertCircle className="h-5 w-5 text-rose-400" />;
            borderColor = "border-rose-500/30";
            glowColor = "shadow-rose-500/10";
          } else if (toast.type === "warning") {
            icon = <AlertCircle className="h-5 w-5 text-amber-400" />;
            borderColor = "border-amber-500/30";
            glowColor = "shadow-amber-500/10";
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${borderColor} ${bgColor} backdrop-blur-xl shadow-lg ${glowColor} transition-all duration-300 animate-slide-in`}
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-bold text-zinc-100">{toast.title}</h4>
                {toast.message && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
