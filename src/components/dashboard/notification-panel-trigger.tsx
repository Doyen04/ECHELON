"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock3, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardNotification } from "@/lib/dashboard-data";

type NotificationPanelTriggerProps = {
  notifications: DashboardNotification[];
};

export function NotificationPanelTrigger({ notifications }: NotificationPanelTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative rounded-full"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {notifications.length > 0 ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-status-warning" /> : null}
      </Button>

      <div
        className={`fixed inset-0 z-60 transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          aria-label="Close notifications"
        />

        <aside
          className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-border/70 bg-background shadow-2xl transition-transform duration-300 ease-out sm:max-w-md ${isOpen ? "translate-x-0" : "translate-x-full"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <header className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-serif text-xl text-foreground">Notifications</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Latest activity across uploads, approvals, and dispatch.</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {notifications.length === 0 ? (
              <article className="rounded-2xl border border-border/70 bg-card px-4 py-5 text-sm text-muted-foreground">
                No delivery alerts at the moment.
              </article>
            ) : (
              notifications.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${item.level === "error" ? "bg-status-danger/15 text-status-danger" : item.level === "warning" ? "bg-status-warning/15 text-status-warning" : "bg-brand/10 text-brand"}`}>
                      {item.level === "error" ? <AlertTriangle className="h-4 w-4" /> : item.level === "warning" ? <AlertTriangle className="h-4 w-4" /> : index % 2 === 0 ? <Clock3 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{item.time}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>
    </>
  );
}