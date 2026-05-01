"use client";

import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { cn } from "@/lib/utils";

type SheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

export function Sheet({ isOpen, onClose, title, description, children, footer }: SheetProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === "Escape") onClose();
            };
            window.addEventListener("keydown", onKeyDown);
            return () => {
                document.body.style.overflow = "unset";
                window.removeEventListener("keydown", onKeyDown);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen || !isMounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div
                className={cn(
                    "relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl animate-in slide-in-from-right duration-300 ease-out border-l border-border",
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="space-y-1">
                        <h2 className="font-sans text-lg font-bold leading-none text-foreground">
                            {title}
                        </h2>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        className="rounded-full"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>

                {footer && (
                    <div className="border-t border-border p-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
