"use client";

import { AlertTriangle, X } from "lucide-react";
import React, { useEffect, useState } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children, icon }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity page-transition-enter"
        onClick={onClose}
      />
      
      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-[var(--color-surface)] shadow-2xl modal-enter">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-[var(--color-accent)]">{icon}</div>}
            <h2 className="font-serif text-xl text-[var(--color-text-primary)]">
              {title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText: string;
  requiredWord?: string;
  isDestructive?: boolean;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  requiredWord = "SEND",
  isDestructive = false,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");
  
  // Reset input when opened
  useEffect(() => {
    if (isOpen) setInputValue("");
  }, [isOpen]);

  const isValid = requiredWord ? inputValue === requiredWord : true;
  
  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={isDestructive ? <AlertTriangle className="h-6 w-6 text-[var(--color-danger)]" /> : undefined}
    >
      <div className="space-y-6">
        <div className="text-sm text-[var(--color-text-muted)]">
          {description}
        </div>

        {requiredWord && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
              Type "{requiredWord}" to confirm:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              placeholder={requiredWord}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive 
                ? "bg-[var(--color-danger)] hover:bg-red-800" 
                : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
