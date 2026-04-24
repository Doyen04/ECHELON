import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
    "relative w-full rounded-2xl border px-4 py-3 text-sm [&:has(svg)]:grid [&:has(svg)]:grid-cols-[20px_1fr] [&:has(svg)]:gap-x-3 [&:has(svg)]:gap-y-0.5 [&>svg]:size-4 [&>svg]:translate-y-0.5",
    {
        variants: {
            variant: {
                default: "border-border/70 bg-card text-card-foreground",
                destructive: "border-destructive/40 bg-destructive/10 text-destructive [&>svg]:text-destructive",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Alert({
    className,
    variant,
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
    return (
        <div
            role="alert"
            data-slot="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
    return <h5 data-slot="alert-title" className={cn("font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
    return <div data-slot="alert-description" className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };