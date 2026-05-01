"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

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

    const retryFailedSends = () => {
        if (!preview?.canRetry || isRetrying) {
            return;
        }

        startRetrying(async () => {
            setLoadError(null);

            try {
                const response = await fetch(`/api/delivery/${dispatchId}/retry`, {
                    method: "POST",
                });

                const payload = await response.json().catch(() => null);
                if (!response.ok) {
                    setLoadError(payload?.error ?? "Failed to retry failed sends.");
                    return;
                }

                closeModal();
                router.refresh();
            } catch {
                setLoadError("Network error while retrying failed sends.");
            }
        });
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-border-subtle bg-surface-main px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-subtle sm:w-auto"
                onClick={() => setIsOpen(true)}
                disabled={failedCount === 0}
            >
                <RefreshCw className="h-4 w-4" />
                {failedCount === 0 ? "No failed sends" : "Retry failed sends"}
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                title="Retry Failed Sends"
                icon={<RefreshCw className="h-5 w-5" />}
            >
                <div className="space-y-5">
                    <div className="space-y-2 text-sm text-text-muted">
                        <p>Review every failed send before retrying. Rows without a usable parent email contact are blocked to avoid repeating the delivery error.</p>
                        {preview ? (
                            <p>
                                Failed sends: <span className="font-semibold text-foreground">{preview.totalFailed}</span> | Retryable: <span className="font-semibold text-foreground">{preview.retryableCount}</span> | Blocked: <span className="font-semibold text-foreground">{preview.unresolvedCount}</span>
                            </p>
                        ) : null}
                    </div>

                    {loadError ? (
                        <div className="flex items-start gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <span>{loadError}</span>
                        </div>
                    ) : null}

                    {isLoading ? (
                        <div className="rounded-xl border border-border-subtle bg-surface-main px-4 py-6 text-sm text-text-muted">
                            Loading failed send details...
                        </div>
                    ) : null}

                    {preview ? (
                        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                            {preview.items.map((item) => (
                                <article key={item.id} className="rounded-2xl border border-border-subtle bg-surface-main p-4 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.studentName}</p>
                                            <p className="mt-0.5 text-xs text-text-muted">{item.matricNumber}</p>
                                        </div>
                                        <Badge variant={item.retryBlockedReason ? "warning" : "success"} className="rounded-full">
                                            {item.retryBlockedReason ? "Blocked" : "Retryable"}
                                        </Badge>
                                    </div>

                                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 px-3 py-2">
                                            <p className="text-xs uppercase tracking-widest text-text-muted">Parent contact</p>
                                            <div className="mt-2 space-y-1 text-foreground">
                                                <p className="font-medium">{item.guardianName ?? "No parent contact found"}</p>
                                                <p className="text-xs text-text-muted">
                                                    Email: {item.guardianEmail ?? "Not available"}
                                                </p>
                                                <p className="text-xs text-text-muted">
                                                    Phone: {item.guardianPhone ?? "Not available"}
                                                </p>
                                                <p className="text-xs text-text-muted">
                                                    Source: {item.resolvedFrom === "original" ? "From failed log" : item.resolvedFrom === "current" ? "Current student contacts" : "Missing"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 px-3 py-2">
                                            <p className="text-xs uppercase tracking-widest text-text-muted">Failure details</p>
                                            <div className="mt-2 space-y-1 text-foreground">
                                                <p className="text-xs text-text-muted">Attempted: {new Date(item.attemptedAt).toLocaleString()}</p>
                                                <p className="text-xs text-text-muted">Reason: {item.failureReason ?? "No failure reason stored."}</p>
                                                <p className="text-xs text-text-muted">
                                                    {item.retryBlockedReason ?? "This send can be retried safely."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={closeModal} className="rounded-full">
                            Close
                        </Button>
                        <Button
                            type="button"
                            onClick={retryFailedSends}
                            className="rounded-full"
                            disabled={!preview?.canRetry || isRetrying || isLoading || !preview}
                        >
                            <RefreshCw className="h-4 w-4" />
                            {isRetrying ? "Retrying..." : "Retry failed sends"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}