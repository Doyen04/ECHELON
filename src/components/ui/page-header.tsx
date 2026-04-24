import React from 'react';

import { Separator } from "@/components/ui/separator";

type PageHeaderProps = {
    title: React.ReactNode;
    breadcrumbs?: React.ReactNode;
    action?: React.ReactNode;
};

export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80 page-transition-enter">
            <div className="flex h-18 items-center justify-between px-6">
                <div className="flex flex-col justify-center">
                    {breadcrumbs && (
                        <div className="mb-0.5 text-xs font-medium text-muted-foreground">
                            {breadcrumbs}
                        </div>
                    )}
                    <h1 className="font-serif text-xl leading-none text-foreground">
                        {title}
                    </h1>
                </div>
                {action && (
                    <div className="flex items-center">
                        {action}
                    </div>
                )}
            </div>
            <Separator className="bg-linear-to-r from-brand/25 via-border to-transparent" />
        </header>
    );
}
