import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/dashboard";

export const metadata: Metadata = {
    title: "Students",
    description: "Student and guardian contact records.",
};

export default function StudentsPage() {
    return (
        <FeaturePlaceholder
            title="Student And Guardian Records"
            description="This area will support profile lookup, guardian channel preferences, NDPR consent capture, and contact correction before dispatch runs."
        />
    );
}
