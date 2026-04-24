import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type SectionFrameProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
};

export function SectionFrame({
    title,
    description,
    action,
    children,
    className,
}: SectionFrameProps) {
    return (
        <Card className={`dashboard-section overflow-hidden ${className ?? ""}`}>
            <CardHeader className="space-y-0 p-6 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-6 pt-5">{children}</CardContent>
        </Card>
    );
}
