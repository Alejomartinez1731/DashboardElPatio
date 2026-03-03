'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-400',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
};

function ToastItem({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;
  const duration = toast.duration || 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${config.bgColor} ${config.borderColor}
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        max-w-md
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">{toast.message}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0 h-6 w-6 p-0 text-muted-foreground hover:text-white"
        onClick={handleClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Función global para agregar toasts (será usada por el hook)
  useEffect(() => {
    (window as any).__addToast = (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, { ...toast, id }]);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

/**
 * Hook para mostrar toasts desde cualquier componente
 */
export function useToast() {
  const show = (type: ToastType, message: string, duration?: number) => {
    const addToast = (window as any).__addToast;
    if (addToast) {
      addToast({ type, message, duration });
    }
  };

  return {
    success: (message: string, duration?: number) => show('success', message, duration),
    error: (message: string, duration?: number) => show('error', message, duration),
    warning: (message: string, duration?: number) => show('warning', message, duration),
    info: (message: string, duration?: number) => show('info', message, duration),
  };
}
