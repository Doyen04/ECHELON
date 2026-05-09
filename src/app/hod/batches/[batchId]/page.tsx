"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { 
    ArrowLeft, 
    Calendar, 
    User, 
    CheckCircle2, 
    Clock, 
    AlertTriangle,
    FileText,
    History,
    Loader2,
    Download,
    XCircle,
    RotateCcw
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { SummaryCard } from "@/components/shared/summary-card";
import { toast } from "sonner";
import { columns } from "./columns";
import { cn } from "@/lib/utils";

type BatchPageProps = {
    params: Promise<{
        batchId: string;
    }>;
};

export default function HodBatchDetailPage({ params }: BatchPageProps) {
    const { batchId } = use(params);
    const [batch, setBatch] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/hod/batches/${batchId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setBatch(data);
            })
            .catch(err => {
                console.error("Failed to load batch", err);
                toast.error(err.message || "Failed to load batch details");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [batchId]);

    const handleCancel = async () => {
        if (confirm("Are you sure you want to cancel this batch? This action cannot be undone.")) {
            try {
                const res = await fetch(`/api/hod/batches/${batch.id}/cancel`, { method: "POST" });
                if (res.ok) {
                    toast.success("Batch cancelled successfully");
                    window.location.href = "/hod/batches";
                } else {
                    toast.error("Failed to cancel batch");
                }
            } catch (err) {
                toast.error("Network error");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-background h-full">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <p className="text-sm text-muted-foreground font-medium">Fetching records...</p>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-background h-full">
                <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold">Batch data unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1">This record might have been archived or deleted.</p>
                <Button asChild variant="link" className="mt-4 text-brand font-bold">
                    <Link href="/hod/batches">Return to History</Link>
                </Button>
            </div>
        );
    }

    const averageGpa = (batch.studentResults.reduce((acc: number, r: any) => acc + r.gpa, 0) / (batch.studentResults.length || 1)).toFixed(2);

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
            <PageHeader 
                title={batch.program.name}
                breadcrumbs={
                    <div className="flex items-center gap-1">
                        <Link href="/hod/batches" className="text-muted-foreground hover:text-foreground transition-colors">History</Link>
                        <span className="text-muted-foreground/50 mx-1">/</span>
                        <span className="text-foreground font-bold">{batch.id}</span>
                    </div>
                }
                action={
                    <div className="flex items-center gap-3">
                        {batch.status === "PENDING" && (
                            <Button 
                                variant="outline" 
                                className="rounded-full border-rose-500/20 text-rose-600 hover:bg-rose-50 hover:border-rose-500/40 font-bold text-xs uppercase"
                                onClick={handleCancel}
                            >
                                <XCircle className="mr-2 h-3.5 w-3.5" />
                                Cancel Batch
                            </Button>
                        )}
                        {batch.status === "REJECTED" && (
                            <Button className="bg-brand hover:bg-brand-hover rounded-full shadow-lg font-bold text-xs uppercase">
                                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                Re-upload Corrected
                            </Button>
                        )}
                        <Button variant="outline" className="rounded-full font-bold text-xs uppercase border-border">
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Report
                        </Button>
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border/50">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">{batch.program.name}</h1>
                            <Badge variant="outline" className={cn(
                                "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border-none",
                                batch.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" : 
                                batch.status === "REJECTED" ? "bg-rose-50 text-rose-600" : 
                                "bg-amber-50 text-amber-600"
                            )}>
                                {batch.status}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {batch.session} • {batch.semester}</span>
                            <span className="flex items-center gap-2"><User className="h-4 w-4" /> {batch.level} Level</span>
                            <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-[10px] font-bold border border-border/50">ID: {batch.id}</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard title="Total Students" value={batch.studentResults.length} className="bg-card shadow-sm border-border" />
                    <SummaryCard title="Average GPA" value={averageGpa} className="bg-card shadow-sm border-border" />
                    <SummaryCard title="Upload Date" value={new Date(batch.uploadedAt).toLocaleDateString()} className="bg-card shadow-sm border-border" />
                    <SummaryCard title="Format" value={batch.source.toUpperCase()} className="bg-card shadow-sm border-border" />
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                                Student Result List
                            </h2>
                            <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold">
                                {batch.studentResults.length} Records
                            </Badge>
                        </div>
                        <Card className="overflow-hidden border-border bg-card shadow-sm text-black">
                            <DataTable 
                                data={batch.studentResults} 
                                columns={columns}
                                className="border-none"
                                hideCount={true}
                            />
                        </Card>
                    </section>

                    <aside className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                                Upload Metadata
                            </h2>
                            <Card className="p-6 border-border bg-card shadow-sm space-y-5">
                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-xs uppercase tracking-tighter">Uploader</span>
                                        <span className="font-bold text-foreground">{batch.uploadedBy.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-xs uppercase tracking-tighter">Session</span>
                                        <span className="font-bold text-foreground">{batch.session}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-xs uppercase tracking-tighter">Semester</span>
                                        <span className="font-bold text-foreground">{batch.semester}</span>
                                    </div>
                                </div>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                                Lifecycle Events
                            </h2>
                            <div className="space-y-3">
                                <div className="relative pl-6 pb-6 before:absolute before:left-1.75 before:top-2 before:bottom-0 before:w-px before:bg-border">
                                    <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-brand bg-background" />
                                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-foreground uppercase tracking-tight">Batch Uploaded</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(batch.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(batch.uploadedAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                
                                {batch.status === "APPROVED" && (
                                    <div className="relative pl-6 pb-2">
                                        <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-500 bg-background" />
                                        <div className="rounded-xl border border-emerald-500/10 bg-emerald-50/30 p-4 shadow-sm space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-tight">Batch Approved</span>
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            </div>
                                            <p className="text-[10px] text-emerald-600/80 font-medium">
                                                Finalized by Super Admin
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {batch.status === "REJECTED" && (
                                    <div className="relative pl-6 pb-2">
                                        <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-rose-500 bg-background" />
                                        <div className="rounded-xl border border-rose-500/10 bg-rose-50/30 p-4 shadow-sm space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-tight">Batch Rejected</span>
                                                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                            </div>
                                            <p className="text-[10px] text-rose-600/80 font-medium leading-relaxed">
                                                Requires correction. See HOD dashboard for feedback.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}
