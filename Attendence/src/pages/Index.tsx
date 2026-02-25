import { useState } from "react";
import { GraduationCap, Users, BarChart2, ChevronRight } from "lucide-react";
import StudentAttendance from "@/pages/StudentAttendance";
import StaffAttendance from "@/pages/StaffAttendance";
import ViewAttendance from "@/pages/ViewAttendance";

type ActiveView = "home" | "student" | "staff" | "view";

const Index = () => {
  const [activeView, setActiveView] = useState<ActiveView>("home");

  if (activeView === "student") {
    return (
      <StudentAttendance
        onBack={() => setActiveView("home")}
        onSaved={() => setActiveView("view")}
      />
    );
  }

  if (activeView === "staff") {
    return (
      <StaffAttendance
        onBack={() => setActiveView("home")}
        onSaved={() => setActiveView("view")}
      />
    );
  }

  if (activeView === "view") {
    return <ViewAttendance onBack={() => setActiveView("home")} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="w-full max-w-sm space-y-1 text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          📋 Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Option Cards */}
      <div className="w-full max-w-sm space-y-4">
        {/* Student Attendance */}
        <button
          onClick={() => setActiveView("student")}
          className="w-full flex items-center gap-4 rounded-2xl bg-card border border-border px-5 py-5 text-left shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">Student Attendance</p>
            <p className="text-sm text-muted-foreground mt-0.5">Mark attendance for students</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Staff Attendance */}
        <button
          onClick={() => setActiveView("staff")}
          className="w-full flex items-center gap-4 rounded-2xl bg-card border border-border px-5 py-5 text-left shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">Staff Attendance</p>
            <p className="text-sm text-muted-foreground mt-0.5">Mark attendance for staff members</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* View Attendance */}
        <button
          onClick={() => setActiveView("view")}
          className="w-full flex items-center gap-4 rounded-2xl bg-card border border-border px-5 py-5 text-left shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500 shrink-0">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">View Attendance</p>
            <p className="text-sm text-muted-foreground mt-0.5">Review records for students &amp; staff</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </main>
  );
};

export default Index;
