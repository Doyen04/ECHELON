"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
    LayoutDashboard, 
    Upload, 
    ClipboardList, 
    CheckCircle2, 
    Clock, 
    ArrowRight,
    Loader2,
    BookOpen
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SummaryCard } from "@/components/shared/summary-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function HodDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/hod/stats")
            .then(res => res.json())
            .then(data => {
                setData(data);
            })
            .catch(err => {
                console.error("Dashboard error:", err);
                toast.error("Failed to load dashboard data");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-sidebar-primary" />
                <p className="text-sm text-muted-foreground font-medium">Loading HOD portal...</p>
            </div>
        );
    }

    const stats = data?.stats || { totalBatches: 0, pendingBatches: 0, approvedBatches: 0, totalPrograms: 0 };
    const recentBatches = data?.recentBatches || [];

    return (
        <div className="min-h-screen">
            <PageHeader 
                title="HOD Dashboard" 
                // description="Welcome back. Here's an overview of your department's results management."
                action={
                    <Button asChild className="bg-sidebar-primary hover:bg-sidebar-primary/90 rounded-full shadow-lg">
                        <Link href="/hod/batches/upload">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Results
                        </Link>
                    </Button>
                }
            />

            <main className="mx-auto w-full max-w-7xl py-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <SummaryCard title="Total Batches" value={stats.totalBatches} />
                    <SummaryCard 
                        title="Pending Review" 
                        value={stats.pendingBatches} 
                        color="text-amber-500"
                    />
                    <SummaryCard 
                        title="Approved" 
                        value={stats.approvedBatches} 
                        color="text-emerald-500"
                    />
                    <SummaryCard title="Managed Programs" value={stats.totalPrograms} />
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                Recent Uploads
                            </h2>
                            <Link href="/hod/batches" className="text-xs font-bold text-sidebar-primary hover:underline">
                                View all
                            </Link>
                        </div>
                        <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm">
                            {recentBatches.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {recentBatches.map((batch: any) => (
                                        <Link key={batch.id} href={`/hod/batches/${batch.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary">
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{batch.program.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                        {batch.session} • {batch.semester} • {batch.level}L
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {batch.status === "APPROVED" ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5 text-[9px] uppercase font-bold">Approved</Badge>
                                                ) : (
                                                    <Badge className="bg-amber-500/10 text-amber-500 border-none px-2 py-0.5 text-[9px] uppercase font-bold">Pending</Badge>
                                                )}
                                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-sm text-muted-foreground">No recent uploads found.</p>
                                    <Button asChild variant="link" className="mt-2 text-sidebar-primary">
                                        <Link href="/hod/batches/upload">Upload your first batch</Link>
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </section>

                    <aside className="space-y-6">
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">
                                Quick Actions
                            </h2>
                            <div className="grid gap-3">
                                <Button asChild variant="outline" className="justify-start h-12 rounded-xl border-border bg-card/50 px-4 group">
                                    <Link href="/hod/batches/upload">
                                        <Upload className="h-5 w-5 mr-3 text-sidebar-primary group-hover:scale-110 transition-transform" />
                                        <span className="font-bold text-xs uppercase tracking-wider">New Upload</span>
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="justify-start h-12 rounded-xl border-border bg-card/50 px-4 group">
                                    <Link href="/hod/batches">
                                        <ClipboardList className="h-5 w-5 mr-3 text-sidebar-primary group-hover:scale-110 transition-transform" />
                                        <span className="font-bold text-xs uppercase tracking-wider">Batch History</span>
                                    </Link>
                                </Button>
                            </div>
                        </section>

                        <Card className="p-6 border-border bg-gradient-to-br from-sidebar-primary/20 to-transparent">
                            <h3 className="text-sm font-bold mb-2">HOD Guidelines</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Remember to verify that all students in a batch belong to the same level. Batches are reviewed by the Super Admin before they are approved for parent delivery.
                            </p>
                        </Card>
                    </aside>
                </div>
            </main>
        </div>
    );
}
