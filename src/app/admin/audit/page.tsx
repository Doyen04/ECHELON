import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/dashboard";

export const metadata: Metadata = {
    title: "Audit",
    description: "Compliance and immutable operational logs.",
};

export default function AuditPage() {
    return (
        <FeaturePlaceholder
            title="Audit And Compliance Log"
            description="Immutable records for approvals, withhold actions, dispatch triggers, and administrator access events will be searchable and exportable in this section."
        />
    );
}
