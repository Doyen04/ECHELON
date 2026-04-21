import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/dashboard";

export const metadata: Metadata = {
    title: "Batches",
    description: "Manage result batches and dispatch readiness.",
};

export default function BatchesPage() {
    return (
        <FeaturePlaceholder
            title="Result Batch Management"
            description="This module handles batch listing, approval checkpoints, dispatch eligibility, and CSV export workflows for super-admin operations."
        />
    );
}
