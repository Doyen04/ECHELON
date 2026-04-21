import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/dashboard";

export const metadata: Metadata = {
    title: "Batch Upload",
    description: "Upload or sync result batches from SIS source.",
};

export default function BatchUploadPage() {
    return (
        <FeaturePlaceholder
            title="Batch Upload And SIS Ingestion"
            description="CSV fallback upload and SIS API sync controls will be implemented here, including duplicate detection, diff preview, and source tracking."
        />
    );
}
