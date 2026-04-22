import React from 'react';
import { FileQuestion } from 'lucide-react';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ 
  icon = <FileQuestion className="h-10 w-10" />,
  title = "No data found",
  description = "Get started by adding some content.",
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-12 text-center page-transition-enter">
      <div className="text-[var(--color-text-muted)] mb-4">
        {icon}
      </div>
      <h3 className="font-serif text-lg text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
