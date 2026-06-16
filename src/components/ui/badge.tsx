import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground",
                secondary: "border-transparent bg-secondary text-secondary-foreground",
                outline: "border-border bg-background text-muted-foreground",
                success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
                warning: "border-amber-500/20 bg-amber-500/10 text-amber-600",
                destructive: "border-destructive/20 bg-destructive/10 text-destructive",
                info: "border-sky-500/20 bg-sky-500/10 text-sky-600",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };