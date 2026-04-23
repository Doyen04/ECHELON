export function numberLabel(value: number) {
    return new Intl.NumberFormat("en-US").format(value);
}

export function formatDateTime(value: Date | string | null | undefined) {
    if (!value) {
        return "N/A";
    }

    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export function relativeTimeFromNow(value: Date | string | null | undefined) {
    if (!value) {
        return "N/A";
    }

    const date = value instanceof Date ? value : new Date(value);
    const diffMs = Math.max(Date.now() - date.getTime(), 0);
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return "just now";
    }
    if (diffMinutes < 60) {
        return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function humanizeEnum(value: string) {
    return value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function semesterLabel(value: string) {
    return humanizeEnum(value);
}

export function toBadgeStatus(value: string) {
    return value.toLowerCase().replace(/\s+/g, "_") as
        | "pending"
        | "in_review"
        | "approved"
        | "dispatched"
        | "withheld"
        | "delivered"
        | "failed"
        | "queued";
}