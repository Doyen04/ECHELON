import { Mail, MessageCircle, Phone } from "lucide-react";
import React from "react";

export type StatusType =
  | "pending"
  | "in_review"
  | "approved"
  | "dispatched"
  | "withheld"
  | "delivered"
  | "failed"
  | "queued";

type StatusBadgeProps = {
  status: StatusType;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const configs: Record<StatusType, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
    in_review: { bg: "bg-blue-100", text: "text-blue-800", label: "In Review" },
    approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
    dispatched: { bg: "bg-indigo-500", text: "text-white", label: "Dispatched" },
    withheld: { bg: "bg-red-100", text: "text-red-800", label: "Withheld" },
    delivered: { bg: "bg-green-100", text: "text-green-800", label: "Delivered" },
    failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
    queued: { bg: "bg-slate-100", text: "text-slate-700", label: "Queued" },
  };

  const config = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium font-sans ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: "whatsapp" | "email" | "sms" }) {
  const configs = {
    whatsapp: { bg: "bg-green-500", text: "text-white", icon: MessageCircle, label: "WhatsApp" },
    email: { bg: "bg-blue-500", text: "text-white", icon: Mail, label: "Email" },
    sms: { bg: "bg-slate-500", text: "text-white", icon: Phone, label: "SMS" },
  };
  const config = configs[channel];
  const Icon = config.icon;
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium font-sans ${config.bg} ${config.text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
