"use client";

import { AlertTriangle, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
};

export function Modal({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    icon,
    size = "md" 
}: ModalProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            const previousOverflow = document.body.style.overflow;
            const previousPaddingRight = document.body.style.paddingRight;

            document.body.style.overflow = "hidden";
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }

            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    onClose();
                }
            };

            window.addEventListener("keydown", onKeyDown);

            return () => {
                document.body.style.overflow = previousOverflow;
                document.body.style.paddingRight = previousPaddingRight;
                window.removeEventListener("keydown", onKeyDown);
            };
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
    };

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div
                className={cn(
                    "relative z-10 w-full overflow-y-auto rounded-xl bg-card border border-border  animate-in zoom-in-95 duration-300 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]",
                    sizeClasses[size]
                )}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
                    <div className="flex items-center gap-3">
                        {icon && <div className="text-sidebar-primary">{icon}</div>}
                        <h2 className="text-base font-bold tracking-tight text-foreground">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Close modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 py-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body,
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
                        <Input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={requiredWord}
                            className="bg-muted/50"
                        />
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!isValid}
                        variant={isDestructive ? "destructive" : "default"}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
