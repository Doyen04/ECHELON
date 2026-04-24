"use client";

import type { ChannelDelivery } from "@/lib/dashboard-data";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionFrame } from "./section-frame";

const channelColors: Record<ChannelDelivery["channel"], string> = {
    whatsapp: "#16a34a",
    email: "#0ea5e9",
    sms: "#f59e0b",
};

const channelLabels: Record<ChannelDelivery["channel"], string> = {
    whatsapp: "WhatsApp",
    email: "Email",
    sms: "SMS",
};

function buildChartData(channels: ChannelDelivery[]) {
    return channels.map((channel) => ({
        name: channelLabels[channel.channel],
        value: channel.sent + channel.failed,
        sent: channel.sent,
        failed: channel.failed,
        queued: channel.queued,
        color: channelColors[channel.channel],
    }));
}

function totalSent(channels: ChannelDelivery[]) {
    return channels.reduce((sum, channel) => sum + channel.sent, 0);
}

function totalFailed(channels: ChannelDelivery[]) {
    return channels.reduce((sum, channel) => sum + channel.failed, 0);
}

function totalMessages(channels: ChannelDelivery[]) {
    return channels.reduce((sum, channel) => sum + channel.sent + channel.failed, 0);
}

export function DeliveryChannels({ channels }: { channels: ChannelDelivery[] }) {
    const data = buildChartData(channels);
    const sent = totalSent(channels);
    const failed = totalFailed(channels);
    const total = totalMessages(channels) > 0 ? totalMessages(channels) : 1;

    return (
        <SectionFrame
            title="Upload Distribution"
            description="Message volume by channel"
        >
            {channels.length === 0 ? (
                <EmptyState
                    title="No delivery data yet"
                    description="Channel breakdown will appear after the next batch upload and dispatch run."
                />
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-center">
                        <div className="relative mx-auto h-44 w-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={62}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        stroke="none"
                                    >
                                        {data.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            `${value} messages`,
                                            name,
                                        ]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Total</p>
                                <p className="text-2xl font-semibold text-foreground">{total}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {data.map((entry) => (
                                <Card key={entry.name} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 shadow-none">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-sm font-medium text-foreground">{entry.name}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{Math.round((entry.value / total) * 100)}%</span>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-center text-xs text-(--text-secondary)">
                        <p>
                            <span className="block text-base font-semibold text-foreground">{sent}</span>
                            Sent
                        </p>
                        <p>
                            <span className="block text-base font-semibold text-foreground">{failed}</span>
                            Failed
                        </p>
                    </div>
                </div>
            )}
        </SectionFrame>
    );
}