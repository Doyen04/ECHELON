import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

type EmptyStateProps = {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
};

export function EmptyState({
    icon = <FileQuestion className="h-12 w-12" />,
    title = "No data found",
    description = "Get started by adding some content.",
    action,
    className
}: EmptyStateProps) {
    return (
        <section className={cn("flex min-h-[40vh] items-center justify-center p-4 sm:p-6", className)}>
            <Card className="w-full max-w-md border-dashed">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {icon}
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
                    <CardDescription className="mt-2 text-sm sm:text-base">{description}</CardDescription>
                </CardHeader>
                {action && (
                    <CardContent className="pt-0">
                        <div className="flex justify-center">
                            {action}
                        </div>
                    </CardContent>
                )}
            </Card>
        </section>
    );
}
