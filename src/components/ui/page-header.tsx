import React from 'react';

type PageHeaderProps = {
  title: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  action?: React.ReactNode;
};

export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 page-transition-enter">
      <div className="flex flex-col justify-center">
         {breadcrumbs && (
          <div className="text-xs text-[var(--color-text-muted)] mb-0.5 font-medium">
            {breadcrumbs}
          </div>
        )}
        <h1 className="font-serif text-xl text-[var(--color-text-primary)] leading-none">
          {title}
        </h1>
      </div>
      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}
    </header>
  );
}
