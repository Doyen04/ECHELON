import React from 'react';

import { Separator } from "@/components/ui/separator";

type PageHeaderProps = {
    title: React.ReactNode;
    breadcrumbs?: React.ReactNode;
    action?: React.ReactNode;
};

export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80 page-transition-enter transition-colors duration-200">
            <div className="flex min-h-18 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                    {breadcrumbs && (
                        <div className="mb-0.5 truncate text-xs font-medium text-muted-foreground">
                            {breadcrumbs}
                        </div>
                    )}
                    <h1 className="truncate font-sans text-xl font-bold leading-none text-foreground">
                        {title}
                    </h1>
                </div>
                {action && (
                    <div className="flex w-full items-center justify-start sm:w-auto sm:justify-end">
                        {action}
                    </div>
                )}
            </div>
            <Separator className="opacity-50" />
        </header>
    );
}
