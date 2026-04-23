export type TrendDirection = "up" | "down" | "steady";

export type SummaryMetric = {
    label: string;
    value: string;
    change: string;
    trend: TrendDirection;
    helper: string;
};

export type Semester = "first" | "second" | "third";

export type ApprovalBatch = {
    id: string;
    department: string;
    session: string;
    semester: Semester;
    pending: number;
    approved: number;
    withheld: number;
    contactCoverage: number;
    lastActionAt: string;
};

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
    delivered: number;
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
        helper: "Last 7 days",
    },
];

export const approvalBatches: ApprovalBatch[] = [
    {
        id: "BCH-2404-CS",
        department: "Computer Science",
        session: "2024/2025",
        semester: "first",
        pending: 132,
        approved: 489,
        withheld: 6,
        contactCoverage: 97,
        lastActionAt: "11 mins ago",
    },
    {
        id: "BCH-2404-EE",
        department: "Electrical Engineering",
        session: "2024/2025",
        semester: "first",
        pending: 84,
        approved: 406,
        withheld: 3,
        contactCoverage: 93,
        lastActionAt: "27 mins ago",
    },
    {
        id: "BCH-2404-ACC",
        department: "Accounting",
        session: "2024/2025",
        semester: "first",
        pending: 61,
        approved: 342,
        withheld: 9,
        contactCoverage: 89,
        lastActionAt: "43 mins ago",
    },
    {
        id: "BCH-2404-BIO",
        department: "Biochemistry",
        session: "2024/2025",
        semester: "first",
        pending: 151,
        approved: 218,
        withheld: 4,
        contactCoverage: 95,
        lastActionAt: "1 hr ago",
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
        delivered: 344,
        failed: 12,
    },
    {
        channel: "email",
        queued: 281,
        sent: 281,
        delivered: 273,
        failed: 8,
    },
    {
        channel: "sms",
        queued: 94,
        sent: 93,
        delivered: 88,
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
