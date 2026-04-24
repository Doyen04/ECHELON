import Link from "next/link";
import { Inbox } from "lucide-react";

import { EmptyState as UiEmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
};

export function EmptyState({ title, description, ctaLabel, ctaHref }: EmptyStateProps) {
    return (
        <UiEmptyState
            icon={<Inbox className="h-7 w-7" />}
            title={title}
            description={description}
            className="min-h-0 p-0"
            action={
                ctaLabel && ctaHref ? (
                    <Button asChild variant="default" className="rounded-full">
                        <Link href={ctaHref}>{ctaLabel}</Link>
                    </Button>
                ) : undefined
            }
        />
    );
}
