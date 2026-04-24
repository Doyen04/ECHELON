import type { ChannelDelivery } from "@/lib/dashboard-data";

import { Badge } from "@/components/ui/badge";
import { SectionFrame } from "./section-frame";

function deliveryRate(channel: ChannelDelivery) {
    if (channel.sent === 0) {
        return 0;
    }
    return Math.round((channel.delivered / channel.sent) * 100);
}

export function DeliveryChannels({ channels }: { channels: ChannelDelivery[] }) {
    return (
        <SectionFrame
            title="Delivery By Channel"
            description="WhatsApp is prioritized, with email and SMS fallback in sequence"
        >
            <div className="space-y-4">
                {channels.map((channel) => {
                    const rate = deliveryRate(channel);

                    return (
                        <article
                            key={channel.channel}
                            className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold capitalize text-foreground">{channel.channel}</h3>
                                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                                    Delivery {rate}%
                                </Badge>
                            </div>

                            <div className="mt-2 h-2 rounded-full bg-(--surface-muted)">
                                <div
                                    className="h-2 rounded-full bg-[linear-gradient(90deg,var(--accent-soft),var(--accent-strong))]"
                                    style={{ width: `${rate}%` }}
                                />
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-(--text-secondary) sm:grid-cols-4">
                                <p>Queued: {channel.queued}</p>
                                <p>Sent: {channel.sent}</p>
                                <p>Delivered: {channel.delivered}</p>
                                <p>Failed: {channel.failed}</p>
                            </div>
                        </article>
                    );
                })}
            </div>
        </SectionFrame>
    );
}
