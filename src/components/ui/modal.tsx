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
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-surface-main shadow-2xl modal-enter">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div className="flex items-center gap-3">
            {icon && <div className="text-brand">{icon}</div>}
            <h2 className="font-serif text-xl text-foreground">
              {title}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface-subtle hover:text-foreground transition-colors"
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
      icon={isDestructive ? <AlertTriangle className="h-6 w-6 text-status-danger" /> : undefined}
    >
      <div className="space-y-6">
        <div className="text-sm text-text-muted">
          {description}
        </div>

        {requiredWord && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Type "{requiredWord}" to confirm:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full rounded border border-border-subtle bg-surface-subtle px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder={requiredWord}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-text-muted hover:text-foreground hover:bg-surface-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDestructive 
                ? "bg-status-danger hover:bg-red-800" 
                : "bg-brand hover:bg-brand-hover"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
