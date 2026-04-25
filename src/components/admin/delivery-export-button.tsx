"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type DeliveryExportButtonProps = {
  dispatchId: string;
};

export function DeliveryExportButton({
  dispatchId,
}: DeliveryExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/delivery/${dispatchId}/export`, {
        method: "GET",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Failed to export delivery logs.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `delivery-${dispatchId}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Network error while exporting delivery logs.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='flex flex-col items-end gap-1'>
      <Button
        type='button'
        variant='outline'
        className='rounded-full'
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download className='h-4 w-4' />
        {isExporting ? "Exporting..." : "Export CSV"}
      </Button>
      {error ? <p className='text-xs text-status-danger'>{error}</p> : null}
    </div>
  );
}
