"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportButtonProps = {
    endpoint: string;
    filename: string;
    label?: string;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon" | "xs";
    className?: string;
};

export function ExportButton({
    endpoint,
    filename,
    label = "Export",
    variant = "outline",
    size = "default",
    className = "rounded-full",
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);

        try {
            const response = await fetch(endpoint, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            if (!response.ok) {
                let errorMessage = `Export failed (HTTP ${response.status})`;
                const contentType = response.headers.get("content-type") ?? "";

                if (contentType.includes("application/json")) {
                    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                    if (payload?.error) {
                        errorMessage = payload.error;
                    }
                } else {
                    const text = await response.text().catch(() => "");
                    if (text) {
                        errorMessage = text;
                    }
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
            const message = error instanceof Error ? error.message : "Failed to export data.";
            alert(message || "Failed to export data.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleExport}
            disabled={isExporting}
        >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : label}
        </Button>
    );
}
