import { useEffect } from "react";
import { sampleStudents } from "@/data/students";
import { useViewAttendance, AttendanceDay } from "@/hooks/useViewAttendance";
import { Calendar, Loader2, ArrowLeft } from "lucide-react";

interface ViewAttendanceProps {
  onBack: () => void;
}

// Collect unique class sections from student data
const allClasses = [...new Set(sampleStudents.map((s) => s.classSection))].sort();

function getDayLabel(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function StudentRow({
  studentId,
  status,
}: {
  studentId: string;
  status: "present" | "absent";
}) {
  const student = sampleStudents.find((s) => s.id === studentId);
  if (!student) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
        {student.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-card-foreground truncate">{student.name}</p>
        <p className="text-xs text-muted-foreground">
          {student.rollNumber} · {student.classSection}
        </p>
      </div>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          status === "present"
            ? "bg-present/15 text-present"
            : "bg-absent/15 text-absent"
        }`}
      >
        {status === "present" ? "Present" : "Absent"}
      </span>
    </div>
  );
}

function DaySummaryCard({ day }: { day: AttendanceDay }) {
  const present = day.records.filter((r) => r.status === "present").length;
  const total = day.records.length;
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <span className="text-sm font-semibold text-foreground">{getDayLabel(day.date)}</span>
        <span
          className="text-xs text-muted-foreground"
          aria-label={`${present} out of ${total} students present`}
        >
          {present}/{total} present
        </span>
      </div>
      <div className="divide-y divide-border">
        {day.records.map((r) => (
          <StudentRow key={r.studentId} studentId={r.studentId} status={r.status} />
        ))}
      </div>
    </div>
  );
}

function ClasswiseView({ attendanceDays }: { attendanceDays: AttendanceDay[] }) {
  // Aggregate all records across all days, group by classSection
  const byClass: Record<string, { present: number; absent: number; total: number }> = {};

  for (const cls of allClasses) {
    byClass[cls] = { present: 0, absent: 0, total: 0 };
  }

  for (const day of attendanceDays) {
    for (const record of day.records) {
      const student = sampleStudents.find((s) => s.id === record.studentId);
      if (!student) continue;
      const cls = student.classSection;
      if (!byClass[cls]) byClass[cls] = { present: 0, absent: 0, total: 0 };
      byClass[cls].total += 1;
      if (record.status === "present") byClass[cls].present += 1;
      else byClass[cls].absent += 1;
    }
  }

  return (
    <div className="space-y-3">
      {allClasses.map((cls) => {
        const { present, absent, total } = byClass[cls];
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return (
          <div key={cls} className="rounded-2xl bg-card border border-border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{cls}</span>
              <span className="text-xs text-muted-foreground">
                {present} present · {absent} absent
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-present transition-all duration-500"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cls} attendance rate: ${pct}%`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{pct}% attendance rate</p>
          </div>
        );
      })}
    </div>
  );
}

const TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "classwise", label: "By Class" },
] as const;

export default function ViewAttendance({ onBack }: ViewAttendanceProps) {
  const {
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    attendanceDays,
    isLoading,
    fetchError,
    load,
  } = useViewAttendance();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDate]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="w-full max-w-sm space-y-1 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          📊 View Attendance
        </h1>
        <p className="text-sm text-muted-foreground">Review saved attendance records</p>
      </header>

      {/* Tabs */}
      <div className="w-full max-w-sm mb-4">
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                viewMode === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date picker */}
      <div className="w-full max-w-sm mb-5">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none"
          />
          <span className="text-xs text-muted-foreground">
            {viewMode === "daily"
              ? "Day"
              : viewMode === "weekly"
              ? "Week"
              : "Month"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-sm space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading attendance…</p>
          </div>
        ) : fetchError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {fetchError}
          </div>
        ) : attendanceDays.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No attendance records found for this period.</p>
          </div>
        ) : viewMode === "classwise" ? (
          <ClasswiseView attendanceDays={attendanceDays} />
        ) : (
          attendanceDays.map((day) => <DaySummaryCard key={day.date} day={day} />)
        )}
      </div>
    </main>
  );
}
