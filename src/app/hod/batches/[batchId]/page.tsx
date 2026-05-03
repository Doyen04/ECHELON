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
    Loader2
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { SummaryCard } from "@/components/shared/summary-card";
import { toast } from "sonner";
import { columns } from "./columns";

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
            case "PENDING":
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase"><Clock className="h-3 w-3 mr-1" /> Pending Review</Badge>;
            case "REJECTED":
                return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase"><AlertTriangle className="h-3 w-3 mr-1" /> Rejected</Badge>;
            case "DISPATCHED":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> Dispatched</Badge>;
            default:
                return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-sidebar-primary" />
                <p className="text-sm text-muted-foreground">Loading batch details...</p>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="text-center py-20">
                <h3 className="text-lg font-bold">Batch not found</h3>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/hod/batches">Back to My Batches</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <PageHeader 
                title={batch.program.name}
                breadcrumbs={
                    <div className="flex items-center gap-1 text-sm font-medium">
                        <Link href="/hod/batches" className="text-muted-foreground hover:text-foreground transition-colors">My Batches</Link>
                        <span className="text-muted-foreground/50 mx-1">/</span>
                        <span className="text-foreground font-bold">{batch.id}</span>
                    </div>
                }
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-full">
                            Download PDF
                        </Button>
                        {batch.status === "PENDING" && (
                            <Button 
                                variant="outline" 
                                className="rounded-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                                onClick={async () => {
                                    if (confirm("Are you sure you want to cancel this batch? This action cannot be undone.")) {
                                        const res = await fetch(`/api/hod/batches/${batch.id}/cancel`, { method: "POST" });
                                        if (res.ok) {
                                            toast.success("Batch cancelled");
                                            window.location.href = "/hod/batches";
                                        } else {
                                            toast.error("Failed to cancel batch");
                                        }
                                    }
                                }}
                            >
                                Cancel Batch
                            </Button>
                        )}
                        {batch.status === "REJECTED" && (
                            <Button className="bg-sidebar-primary hover:bg-sidebar-primary/90 rounded-full">
                                Fix and Resubmit
                            </Button>
                        )}
                    </div>
                }
            />

            <main className="mx-auto w-full max-w-7xl py-6">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{batch.program.name}</h1>
                                {getStatusBadge(batch.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {batch.session} • {batch.semester}</span>
                                <span className="flex items-center gap-1"><User className="h-4 w-4" /> {batch.level} Level</span>
                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded ml-2 uppercase">ID: {batch.id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard title="Total Students" value={batch.studentResults.length} />
                        <SummaryCard 
                            title="Average GPA" 
                            value={(batch.studentResults.reduce((acc: number, r: any) => acc + r.gpa, 0) / (batch.studentResults.length || 1)).toFixed(2)} 
                        />
                        <SummaryCard title="Upload Date" value={new Date(batch.uploadedAt).toLocaleDateString()} />
                        <SummaryCard title="File Source" value={batch.source.toUpperCase()} />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                        <section className="space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">
                                Student Results
                            </h2>
                            <Card className="overflow-hidden border-border bg-card/30 backdrop-blur-sm">
                                <DataTable 
                                    data={batch.studentResults} 
                                    columns={columns}
                                    className="border-0 shadow-none"
                                />
                            </Card>
                        </section>

                        <aside className="space-y-8">
                            <section className="space-y-4">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                    Upload Info
                                </h2>
                                <Card className="p-5 border-border bg-card/30 space-y-4">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Uploader:</span>
                                            <span className="font-bold">{batch.uploadedBy.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Session:</span>
                                            <span className="font-bold">{batch.session}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Semester:</span>
                                            <span className="font-bold">{batch.semester}</span>
                                        </div>
                                    </div>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                                    Status History
                                </h2>
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-border bg-card/30 p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-foreground">Uploaded</span>
                                            <Badge variant="outline" className="text-[9px] uppercase">Initial</Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(batch.uploadedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {batch.status === "APPROVED" && (
                                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-emerald-600">Approved</span>
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <p className="text-[10px] text-emerald-600/70">
                                                By Super Admin • {new Date(batch.approvedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
