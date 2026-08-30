import React from 'react';
import { AlertTriangle, Trash2, Send, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  icon?: 'trash' | 'warning' | 'send';
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  icon = 'warning',
  details,
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-[#0a0a0a] border border-white/20 shadow-2xl p-6 relative overflow-hidden"
        >
          {/* Accent top border */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              confirmVariant === 'danger'
                ? 'bg-[#FF3D00]'
                : confirmVariant === 'warning'
                ? 'bg-amber-500'
                : 'bg-white'
            }`}
          />

          <div className="flex items-start gap-4">
            <div
              className={`p-3 shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30'
                  : confirmVariant === 'warning'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-white/10 text-white border border-white/30'
              }`}
            >
              {icon === 'trash' ? (
                <Trash2 className="w-5 h-5" />
              ) : icon === 'send' ? (
                <Send className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h3 className="text-base font-black text-white uppercase tracking-tight font-display">
                {title}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-light">
                {message}
              </p>

              {details && details.length > 0 && (
                <div className="mt-3 p-3 bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono block">
                    Affected details:
                  </span>
                  <ul className="text-xs font-mono text-white/90 space-y-0.5 list-disc list-inside">
                    {details.map((d, i) => (
                      <li key={i} className="truncate">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              id="btn-confirm-modal-cancel"
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 border border-white/20 text-white/70 hover:text-white hover:border-white/50 text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              id="btn-confirm-modal-action"
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className={`px-5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer disabled:opacity-50 ${
                confirmVariant === 'danger'
                  ? 'bg-[#FF3D00] hover:bg-[#ff5722] text-black shadow-lg shadow-[#FF3D00]/20'
                  : confirmVariant === 'warning'
                  ? 'bg-amber-500 hover:bg-amber-400 text-black'
                  : 'bg-white hover:bg-white/90 text-black'
              }`}
            >
              {isProcessing ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
