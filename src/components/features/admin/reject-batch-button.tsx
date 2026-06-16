"use client";

import React, { useState } from "react";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface RejectBatchButtonProps {
    batchId: string;
    onSuccess?: () => void;
    disabled?: boolean;
}

export function RejectBatchButton({ batchId, onSuccess, disabled }: RejectBatchButtonProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleReject = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/batches/${batchId}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to reject batch");
            }

            toast.success("Batch rejected successfully");
            setIsOpen(false);
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    disabled={disabled}
                    className="rounded-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Batch
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-500">
                        <AlertTriangle className="h-5 w-5" />
                        Reject Result Batch
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Provide a reason for rejecting this batch. The HOD will be notified and asked to fix the issues.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2 block">
                        Reason for Rejection
                    </label>
                    <textarea
                        className="w-full min-h-25 rounded-xl border border-input bg-background/50 p-3 text-sm focus:ring-2 focus:ring-rose-500/30 outline-none transition-all"
                        placeholder="e.g., Incorrect course units for some students, duplicate records detected..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleReject} 
                        disabled={isSubmitting || !reason.trim()}
                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-full"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Confirm Rejection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
