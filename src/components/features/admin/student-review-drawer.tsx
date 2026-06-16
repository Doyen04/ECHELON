"use client";

import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  GraduationCap, 
  FileText, 
  AlertCircle,
  ExternalLink
} from "lucide-react";

type StudentReviewDrawerProps = {
  studentResult: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StudentReviewDrawer({ studentResult, isOpen, onOpenChange }: StudentReviewDrawerProps) {
  if (!studentResult) return null;

  const { student, courses: rawCourses, gpa, cgpa, status } = studentResult;
  const courses = Array.isArray(rawCourses) ? rawCourses : [];

  return (
    <Sheet 
      isOpen={isOpen} 
      onClose={() => onOpenChange(false)}
      title="Student Detail"
      description="Comprehensive result analysis and notification preview."
    >
      <div className="space-y-8 pb-10">
        {/* Identity Section */}
          <section className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">{student.fullName}</h3>
                <p className="text-sm font-mono text-muted-foreground uppercase">{student.matricNumber}</p>
              </div>
              <Badge variant={status === "APPROVED" ? "default" : "outline"}>
                {status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-3 space-y-1 bg-muted/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Semester GPA</p>
                <p className="text-2xl font-bold text-brand">{Number(gpa).toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1 bg-muted/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cumulative GPA</p>
                <p className="text-2xl font-bold text-foreground">{cgpa ? Number(cgpa).toFixed(2) : "N/A"}</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Academic Records */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Course Performance
              </h4>
              <Badge variant="outline">{courses.length} Courses</Badge>
            </div>
            
            <div className="space-y-2">
              {courses.map((course: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground">{course.courseCode}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{course.title || "Academic Course"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold">{course.unit} Units</p>
                      <p className="text-[10px] text-muted-foreground">{course.score ? `Score: ${course.score}` : "No score"}</p>
                    </div>
                    <div className="h-8 w-8 flex items-center justify-center rounded bg-brand/10 border border-brand/20 text-brand font-bold">
                      {course.grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Parent Communication Preview */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" />
              Guardian Notification Preview
            </h4>
            
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-5 space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10">
                 <Mail className="h-16 w-16 -rotate-12" />
               </div>
               
               <div className="space-y-2">
                 <p className="text-xs font-bold text-brand uppercase tracking-tighter">Subject: Academic Result Update</p>
                 <div className="bg-white/50 rounded p-4 text-xs leading-relaxed text-foreground border border-brand/10">
                   Dear Guardian,<br /><br />
                   Official academic results for <strong>{student.fullName}</strong> ({student.matricNumber}) 
                   for the current semester have been released.<br /><br />
                   <strong>Performance Summary:</strong><br />
                   • Semester GPA: {Number(gpa).toFixed(2)}<br />
                   • Total Courses: {courses.length}<br /><br />
                   You can view the detailed result transcript and performance analysis via the secure portal link below:<br />
                   <span className="text-brand underline">https://echelon-registry.edu/results/view?token=...</span>
                   <br /><br />
                   Regards,<br />
                   Office of the Registrar
                 </div>
               </div>

               <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                 <AlertCircle className="h-3 w-3" />
                 This message will be sent via Email and SMS upon final dispatch.
               </div>
            </div>
          </section>

          <div className="pt-4">
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href={`/results/view?preview=true&batchId=${studentResult.batchId}&matric=${student.matricNumber}`} target="_blank">
                View Full Portal Preview <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
      </div>
    </Sheet>
  );
}

import { Button } from "@/components/ui/button";
