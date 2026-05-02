"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { FailedSendPreview } from "@/lib/delivery-retry";

type RetryFailedSendsButtonProps = {
    dispatchId: string;
    failedCount: number;
};

export function RetryFailedSendsButton({ dispatchId, failedCount }: RetryFailedSendsButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState<FailedSendPreview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isRetrying, startRetrying] = useTransition();

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const controller = new AbortController();

        const loadPreview = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch(`/api/delivery/${dispatchId}/retry`, {
                    signal: controller.signal,
                });

                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    setLoadError(payload?.error ?? "Failed to load failed sends.");
                    return;
                }

                setPreview(payload as FailedSendPreview);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setLoadError(error instanceof Error ? error.message : "Failed to load failed sends.");
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void loadPreview();

        return () => controller.abort();
    }, [dispatchId, isOpen]);

    const closeModal = () => {
        if (isRetrying) {
            return;
        }

        setIsOpen(false);
        setPreview(null);
        setLoadError(null);
    };

    const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

    const retryFailedSends = (logId?: string) => {
        if (isRetrying) {
            return;
        }

        if (logId) {
            setRetryingLogId(logId);
        }

        startRetrying(async () => {
            setLoadError(null);

            try {
                const response = await fetch(`/api/delivery/${dispatchId}/retry`, {
                    method: "POST",
                    body: JSON.stringify({ logId }),
                });

                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    setLoadError(payload?.error ?? "Failed to retry failed sends.");
                    toast.error("Retry Failed", { description: payload?.error ?? "Failed to retry failed sends." });
                    setRetryingLogId(null);
                    return;
                }

                if (payload?.retriedCount === 0) {
                    setLoadError("The retry attempt failed repeatedly. Please check your provider settings.");
                    toast.error("Retry Failed", { description: "Message(s) could not be delivered." });
                    
                    if (logId) {
                        const previewResponse = await fetch(`/api/delivery/${dispatchId}/retry`);
                        const previewData = await previewResponse.json();
                        setPreview(previewData);
                    }
                    setRetryingLogId(null);
                    router.refresh();
                    return;
                }

                toast.success("Retry Successful", { description: `Successfully resent ${payload?.retriedCount ?? 0} message(s).` });

                if (logId) {
                    // Just refresh the preview if it was a single retry
                    const previewResponse = await fetch(`/api/delivery/${dispatchId}/retry`);
                    const previewData = await previewResponse.json();
                    setPreview(previewData);
                    setRetryingLogId(null);
                } else {
                    closeModal();
                }
                router.refresh();
            } catch {
                setLoadError("Network error while retrying failed sends.");
                setRetryingLogId(null);
            }
        });
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-xl border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-muted"
                onClick={() => setIsOpen(true)}
                disabled={failedCount === 0}
            >
                <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                {failedCount === 0 ? "No failed sends" : "Retry failures"}
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                title="Retry Failed Sends"
                icon={<RefreshCw className="h-5 w-5" />}
                size="2xl"
            >
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-muted/30 border border-border">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground uppercase tracking-widest">Summary View</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Reviewing <span className="text-foreground font-bold">{failedCount}</span> failures across this dispatch.
                            </p>
                        </div>
                        {preview && (
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Retryable</p>
                                    <p className="text-lg font-bold text-emerald-600">{preview.retryableCount}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Blocked</p>
                                    <p className="text-lg font-bold text-destructive">{preview.unresolvedCount}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {loadError ? (
                        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive font-medium animate-in slide-in-from-top-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{loadError}</span>
                        </div>
                    ) : null}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-xl border border-dashed border-border">
                            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin opacity-50" />
                            <p className="text-sm font-medium text-muted-foreground">Analysing delivery logs...</p>
                        </div>
                    ) : null}

                    {preview ? (
                        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {preview.items.map((item) => (
                                <article 
                                    key={item.id} 
                                    className={cn(
                                        "rounded-xl border p-5 transition-all",
                                        item.retryBlockedReason ? "border-border bg-muted/10 opacity-75" : "border-border bg-card hover:border-sidebar-primary/20"
                                    )}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-foreground">{item.studentName}</h4>
                                                <Badge variant={item.retryBlockedReason ? "secondary" : "outline"} className="text-[10px] font-bold">
                                                    {item.retryBlockedReason ? "Blocked" : "Ready"}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] font-mono text-muted-foreground tracking-tight">{item.matricNumber}</p>
                                        </div>
                                        
                                        {!item.retryBlockedReason && (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                disabled={isRetrying}
                                                onClick={() => retryFailedSends(item.id)}
                                                className="h-8 rounded-md text-[10px] font-bold uppercase tracking-tight bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                            >
                                                {retryingLogId === item.id ? (
                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                ) : "Retry Individually"}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                Parent Contact
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-foreground">{item.guardianName ?? "N/A"}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{item.guardianEmail ?? "No email"}</p>
                                                <p className="text-[11px] text-muted-foreground">{item.guardianPhone ?? "No phone"}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                <div className="h-1 w-1 rounded-full bg-destructive/50" />
                                                Failure Detail
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-medium text-destructive/80 leading-relaxed italic">
                                                    "{item.failureReason ?? "Unknown error"}"
                                                </p>
                                                {item.retryBlockedReason && (
                                                    <p className="text-[10px] font-bold text-destructive mt-1 flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {item.retryBlockedReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : null}

                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={closeModal} 
                            className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => retryFailedSends()}
                            className="rounded-xl w-full sm:w-auto min-w-50 gap-2 bg-sidebar-primary shadow-md shadow-sidebar-primary/20"
                            disabled={!preview?.canRetry || isRetrying || isLoading || !preview}
                        >
                            <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                            {isRetrying ? "Retrying..." : `Retry ${preview?.retryableCount ?? ""} Failures`}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}