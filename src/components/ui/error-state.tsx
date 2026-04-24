"use client";

import { AlertCircle, RotateCw, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

type ErrorStateProps = {
    title?: string;
    description?: string;
    onRetry?: () => void;
    code?: string;
    details?: string;
};

export function ErrorState({
    title = "Something went wrong",
    description = "We could not load this page. Please try again.",
    onRetry,
    code,
    details,
}: ErrorStateProps) {
    return (
        <section className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
            <Card className="w-full max-w-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
                    <CardDescription className="mt-2 text-base">{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(code || details) && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Diagnostic details</AlertTitle>
                            <AlertDescription>
                                {code ? <p><span className="font-semibold">Error Code:</span> {code}</p> : null}
                                {details ? <p><span className="font-semibold">Details:</span> {details}</p> : null}
                            </AlertDescription>
                        </Alert>
                    )}
                    {onRetry && (
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={onRetry}
                                className="w-full"
                                size="default"
                            >
                                <RotateCw className="mr-2 h-4 w-4" />
                                Try again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
