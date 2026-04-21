import { SectionFrame } from "./section-frame";

type ActionItem = {
    title: string;
    detail: string;
    href: string;
    cta: string;
};

const actions: ActionItem[] = [
    {
        title: "Run Pre-Dispatch Checklist",
        detail: "Validate batch approval status, guardian coverage, and estimated cost.",
        href: "/admin/batches",
        cta: "Open checklist",
    },
    {
        title: "Review Failed Deliveries",
        detail: "Inspect failure reasons and retry selected records in bulk.",
        href: "/admin/delivery",
        cta: "Manage retries",
    },
    {
        title: "Update Guardian Contacts",
        detail: "Correct phone and email data before the next dispatch window.",
        href: "/admin/students",
        cta: "Open contacts",
    },
];

const complianceChecks = [
    "No unapproved result batch can be dispatched",
    "Withheld result records remain excluded from delivery",
    "Only contacts with NDPR consent are eligible for sending",
    "Portal access links expire after 30 days",
];

export function QuickActions() {
    return (
        <SectionFrame
            title="Operations Command"
            description="Task shortcuts and compliance guardrails for the super-admin team"
        >
            <div className="space-y-4">
                {actions.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4"
                    >
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-2 text-sm text-(--text-secondary)">{item.detail}</p>
                        <a
                            href={item.href}
                            className="mt-4 inline-flex rounded-lg border border-(--border-strong) px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-(--surface-muted)"
                        >
                            {item.cta}
                        </a>
                    </article>
                ))}

                <div className="rounded-2xl border border-(--border-subtle) bg-(--surface-soft) p-4">
                    <h3 className="text-sm font-semibold text-foreground">
                        Compliance Checklist
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-(--text-secondary)">
                        {complianceChecks.map((rule) => (
                            <li key={rule} className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-(--accent-strong)" />
                                <span>{rule}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </SectionFrame>
    );
}
