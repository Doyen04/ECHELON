import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/dashboard";

export const metadata: Metadata = {
    title: "Approvals",
    description: "Super-admin review and withhold actions.",
};

export default function ApprovalsPage() {
    return (
        <FeaturePlaceholder
            title="Result Approval Workspace"
            description="Department-level and per-student approve, withhold, and review actions are managed here with immutable audit logging for super-admin users."
        />
    );
}
