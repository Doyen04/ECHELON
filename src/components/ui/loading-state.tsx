"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";

type LoadingStateProps = {
    title?: string;
    rows?: number;
    showMetrics?: boolean;
};

export function LoadingState({
    title = "Loading...",
    rows = 5,
    showMetrics = true,
}: LoadingStateProps) {
    return (
        <section aria-live="polite" aria-busy="true" className="min-h-[50vh] w-full p-4 sm:p-6 md:p-8">
            <div className="mx-auto w-full max-w-5xl space-y-6">
                <div className="space-y-2">
                    <CardTitle className="sr-only">{title}</CardTitle>
                    <Skeleton className="h-8 w-48" aria-hidden="true" />
                    <Skeleton className="h-4 w-32" aria-hidden="true" />
                </div>

                {showMetrics && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, index) => (
                            <Card key={index}>
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <Skeleton className="h-4 w-20" aria-hidden="true" />
                                        <Skeleton className="h-8 w-32" aria-hidden="true" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[...Array(rows)].map((_, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-full" aria-hidden="true" />
                                    </div>
                                    <div className="w-24">
                                        <Skeleton className="h-5" aria-hidden="true" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
