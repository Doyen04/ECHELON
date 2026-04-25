export type TrendDirection = "up" | "down" | "steady";

export type SummaryMetric = {
    label: string;
    value: string;
    change: string;
    trend: TrendDirection;
    helper: string;
};

export type Semester = "first" | "second" | "third";



export type DispatchStatus = "queued" | "processing" | "complete" | "partial_failure";

export type DispatchQueueEntry = {
    id: string;
    batchLabel: string;
    totalStudents: number;
    processedStudents: number;
    successRate: number;
    eta: string;
    status: DispatchStatus;
};

export type ChannelDelivery = {
    channel: "whatsapp" | "email" | "sms";
    queued: number;
    sent: number;
    failed: number;
};

export type ActivityLog = {
    id: string;
    actor: string;
    role: "super_admin";
    action: string;
    target: string;
    time: string;
};

export type DashboardNotification = {
    id: string;
    title: string;
    detail: string;
    time: string;
    level: "warning" | "error" | "info";
};

export const summaryMetrics: SummaryMetric[] = [
    {
        label: "Pending Result Reviews",
        value: "428",
        change: "+12.4%",
        trend: "up",
        helper: "Across active batches",
    },
    {
        label: "Approved For Dispatch",
        value: "1,872",
        change: "+8.1%",
        trend: "up",
        helper: "Current academic session",
    },
    {
        label: "Delivery Success Rate",
        value: "96.4%",
        change: "+1.7%",
        trend: "up",
        helper: "Last 24 hours",
    },
];



export const dispatchQueue: DispatchQueueEntry[] = [
    {
        id: "DSP-7310",
        batchLabel: "Computer Science | 2024/2025 | First Semester",
        totalStudents: 627,
        processedStudents: 627,
        successRate: 98.7,
        eta: "Completed",
        status: "complete",
    },
    {
        id: "DSP-7311",
        batchLabel: "Electrical Engineering | 2024/2025 | First Semester",
        totalStudents: 493,
        processedStudents: 412,
        successRate: 95.6,
        eta: "4 mins",
        status: "processing",
    },
    {
        id: "DSP-7312",
        batchLabel: "Accounting | 2024/2025 | First Semester",
        totalStudents: 412,
        processedStudents: 0,
        successRate: 0,
        eta: "Queued",
        status: "queued",
    },
];

export const channelDelivery: ChannelDelivery[] = [
    {
        channel: "whatsapp",
        queued: 362,
        sent: 356,
        failed: 12,
    },
    {
        channel: "email",
        queued: 281,
        sent: 281,
        failed: 8,
    },
    {
        channel: "sms",
        queued: 94,
        sent: 93,
        failed: 5,
    },
];

export const recentActivity: ActivityLog[] = [
    {
        id: "ACT-101",
        actor: "Ada Nkem",
        role: "super_admin",
        action: "Approved 127 student results",
        target: "Computer Science Batch BCH-2404-CS",
        time: "9:41 AM",
    },
    {
        id: "ACT-102",
        actor: "Ibrahim Yusuf",
        role: "super_admin",
        action: "Triggered dispatch",
        target: "Dispatch DSP-7311",
        time: "9:26 AM",
    },
    {
        id: "ACT-103",
        actor: "Miriam Okafor",
        role: "super_admin",
        action: "Reviewed audit export",
        target: "Compliance logs for 2024/2025",
        time: "8:58 AM",
    },
    {
        id: "ACT-104",
        actor: "Grace Bamidele",
        role: "super_admin",
        action: "Retried failed notifications",
        target: "17 guardian contacts",
        time: "8:37 AM",
    },
];
