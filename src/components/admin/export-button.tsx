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
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error("Export failed");

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
            alert("Failed to export data.");
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
