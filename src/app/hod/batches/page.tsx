"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
    Plus, 
    Search, 
    Filter, 
    Calendar, 
    User, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    ChevronRight,
    Loader2
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function HodBatchesPage() {
    const [batches, setBatches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetch("/api/hod/batches")
            .then(res => res.json())
            .then(data => {
                setBatches(data.batches || []);
            })
            .catch(err => {
                console.error("Failed to load batches", err);
                toast.error("Failed to load batches");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const filteredBatches = batches.filter(b => 
        b.program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.session.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
            case "PENDING":
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
            case "DISPATCHED":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> Dispatched</Badge>;
            default:
                return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 px-2 py-0.5 text-[10px] font-bold uppercase">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen">
            <PageHeader 
                title="My Result Batches" 
                description="Manage and track results uploaded for your department's programs."
                actions={
                    <Button asChild className="bg-sidebar-primary hover:bg-sidebar-primary/90 rounded-full shadow-lg">
                        <Link href="/hod/batches/upload">
                            <Plus className="h-4 w-4 mr-2" />
                            Upload New Batch
                        </Link>
                    </Button>
                }
            />

            <main className="mx-auto w-full max-w-7xl py-6">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by program or session..." 
                            className="pl-10 bg-card/50 border-border rounded-xl h-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl border-border bg-card/50 px-5 font-bold uppercase tracking-widest text-[10px]">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-sidebar-primary" />
                        <p className="text-sm text-muted-foreground font-medium">Loading your batches...</p>
                    </div>
                ) : filteredBatches.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 bg-card/20">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold">No batches found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1 mb-8">
                            You haven't uploaded any result batches yet or no matches found for your search.
                        </p>
                        <Button asChild className="rounded-full bg-sidebar-primary">
                            <Link href="/hod/batches/upload">Upload your first batch</Link>
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredBatches.map((batch) => (
                            <Link key={batch.id} href={`/hod/batches/${batch.id}`}>
                                <Card className="p-5 hover:bg-card/80 transition-all border-border group cursor-pointer">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary shrink-0 group-hover:scale-110 transition-transform">
                                                <Calendar className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-base truncate">{batch.program.name}</h3>
                                                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0">
                                                        {batch.level} Level
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> {batch.session} • {batch.semester}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" /> {batch._count.studentResults} Students
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                                                {getStatusBadge(batch.status)}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Uploaded</p>
                                                <p className="text-xs font-bold">{new Date(batch.uploadedAt).toLocaleDateString()}</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
