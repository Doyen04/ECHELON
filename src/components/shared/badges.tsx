import { Mail, MessageCircle, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type StatusType =
    | "pending"
    | "in_review"
    | "approved"
    | "dispatched"
    | "withheld"
    | "sent"
    | "failed"
    | "queued"
    | "processing"
    | "complete"
    | "partial_failure";

type StatusBadgeProps = {
    status: StatusType;
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const configs: Record<StatusType, { variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info"; label: string }> = {
        pending: { variant: "warning", label: "Pending" },
        in_review: { variant: "info", label: "In Review" },
        approved: { variant: "success", label: "Approved" },
        dispatched: { variant: "default", label: "Dispatched" },
        withheld: { variant: "destructive", label: "Withheld" },
        sent: { variant: "success", label: "Sent" },
        failed: { variant: "destructive", label: "Failed" },
        queued: { variant: "secondary", label: "Queued" },
        processing: { variant: "info", label: "Processing" },
        complete: { variant: "success", label: "Complete" },
        partial_failure: { variant: "warning", label: "Partial Failure" },
    };

    const config = configs[status] || configs.pending;

    return (
        <Badge variant={config.variant} className="rounded-full px-2.5 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.08em]">
            {config.label}
        </Badge>
    );
}

export function ChannelBadge({ channel }: { channel: "whatsapp" | "email" | "sms" }) {
    const configs = {
        whatsapp: { variant: "success" as const, icon: MessageCircle, label: "WhatsApp" },
        email: { variant: "info" as const, icon: Mail, label: "Email" },
        sms: { variant: "secondary" as const, icon: Phone, label: "SMS" },
    };
    const config = configs[channel];
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11px] font-medium uppercase tracking-[0.08em]">
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </Badge>
    );
}
