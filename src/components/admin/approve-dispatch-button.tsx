"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApproveDispatchButtonProps = {
    batchId: string;
};

export function ApproveDispatchButton({ batchId }: ApproveDispatchButtonProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    const handleApprove = async () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        setIsError(false);

        try {
            const response = await fetch(`/api/batches/${batchId}/approve`, {
                method: "POST",
            });

            const body = await response.json().catch(() => null);
            if (!response.ok) {
                setIsError(true);
                setMessage(body?.error ?? "Approval failed.");
                return;
            }

            setMessage("Batch approved and queued for parent delivery.");
            router.refresh();
        } catch {
            setIsError(true);
            setMessage("Network error while approving batch.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isSubmitting ? "Approving..." : "Approve & Dispatch"}
            </button>
            {message ? (
                <p className={`text-xs ${isError ? "text-status-danger" : "text-status-success"}`}>
                    {message}
                </p>
            ) : null}
        </div>
    );
}
