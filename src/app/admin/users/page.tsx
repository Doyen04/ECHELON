"use client";

import React, { useEffect, useState } from "react";
import { 
    Plus, 
    UserPlus, 
    Shield, 
    User, 
    Mail, 
    Building2, 
    MoreVertical,
    Loader2,
    X,
    Check
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function AdminUserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "hod" as "super_admin" | "hod",
        departmentId: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = () => {
        setIsLoading(true);
        fetch("/api/admin/users")
            .then(res => res.json())
            .then(data => setUsers(data.users || []))
            .catch(err => toast.error("Failed to load users"))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchUsers();
        fetch("/api/admin/departments")
            .then(res => res.json())
            .then(data => {
                setDepartments(data.departments || []);
                if (data.departments?.length > 0) {
                    setFormData(prev => ({ ...prev, departmentId: data.departments[0].id }));
                }
            });
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const res = await fetch("/api/admin/users/create", {
                method: "POST",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" }
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create user");
            
            toast.success("User created successfully");
            setIsCreateOpen(false);
            setFormData({ name: "", email: "", password: "", role: "hod", departmentId: departments[0]?.id || "" });
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen">
            <PageHeader 
                title="User Management" 
                // description="Manage administrative users and Head of Departments (HODs)."
                action={
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-sidebar-primary hover:bg-sidebar-primary/90 rounded-full">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add New User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Create New User</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Full Name</label>
                                    <Input 
                                        required 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Email Address</label>
                                    <Input 
                                        required 
                                        type="email"
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Initial Password</label>
                                    <Input 
                                        required 
                                        type="password"
                                        value={formData.password} 
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Access Role</label>
                                    <select 
                                        className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm"
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                                    >
                                        <option value="hod">Head of Department (HOD)</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                                {formData.role === "hod" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Assigned Department</label>
                                        <select 
                                            className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm"
                                            value={formData.departmentId}
                                            onChange={e => setFormData({...formData, departmentId: e.target.value})}
                                        >
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                        Create User Account
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <main className="mx-auto w-full max-w-7xl py-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-sidebar-primary" />
                        <p className="text-sm text-muted-foreground font-medium">Loading user directory...</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {users.map((user) => (
                            <Card key={user.id} className="p-5 border-border bg-card/50 hover:bg-card/80 transition-all">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                                            user.role === "super_admin" ? "bg-sidebar-primary/10 text-sidebar-primary" : "bg-purple-500/10 text-purple-500"
                                        )}>
                                            {user.role === "super_admin" ? <Shield className="h-6 w-6" /> : <User className="h-6 w-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-base truncate">{user.name}</h3>
                                                <Badge variant="secondary" className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                                                    user.role === "super_admin" ? "bg-sidebar-primary/10 text-sidebar-primary" : "bg-purple-500/10 text-purple-500"
                                                )}>
                                                    {user.role === "super_admin" ? "Super Admin" : "HOD"}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground font-medium">
                                                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                                                {user.role === "hod" && (
                                                    <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {user.department?.name || "No Dept Assigned"}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                                        <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest h-9 px-4">
                                            Edit
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
