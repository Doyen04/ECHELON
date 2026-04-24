import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                className,
            )}
            {...props}
        />
    );
}

export { Input };