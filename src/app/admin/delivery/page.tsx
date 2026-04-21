import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/dashboard";

export const metadata: Metadata = {
    title: "Delivery",
    description: "Notification delivery tracking and retry controls.",
};

export default function DeliveryPage() {
    return (
        <FeaturePlaceholder
            title="Delivery Tracking Center"
            description="Delivery logs, status transitions, failure diagnostics, and targeted retry actions for WhatsApp, Email, and SMS channels will be managed here."
        />
    );
}
