import { sampleStudents, AttendanceRecord } from "@/data/students";
import { Check, X, Download, RotateCcw, Save, Loader2 } from "lucide-react";

interface AttendanceSummaryProps {
  records: AttendanceRecord[];
  presentCount: number;
  absentCount: number;
  onExportCSV: () => void;
  onReset: () => void;
  onSaveToServer: () => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
}

export default function AttendanceSummary({
  records,
  presentCount,
  absentCount,
  onExportCSV,
  onReset,
  onSaveToServer,
  isSaving,
  saveError,
  saveSuccess,
}: AttendanceSummaryProps) {
  const total = records.length;
  const presentPct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-center text-foreground">Attendance Complete ✅</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-present/10 border border-present/20 p-4 text-center">
          <p className="text-3xl font-extrabold text-present">{presentCount}</p>
          <p className="text-sm font-medium text-present/80">Present</p>
        </div>
        <div className="rounded-2xl bg-absent/10 border border-absent/20 p-4 text-center">
          <p className="text-3xl font-extrabold text-absent">{absentCount}</p>
          <p className="text-sm font-medium text-absent/80">Absent</p>
        </div>
      </div>

      {/* Percentage bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Attendance Rate</span>
          <span>{presentPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-present transition-all duration-500"
            style={{ width: `${presentPct}%` }}
          />
        </div>
      </div>

      {/* Student list */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {records.map((record) => {
            const student = sampleStudents.find((s) => s.id === record.studentId)!;
            return (
              <div key={record.studentId} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                  {student.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                </div>
                {record.status === "present" ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-present/15 text-present">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-absent/15 text-absent">
                    <X className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save / Export actions */}
      {saveError && (
        <p className="text-sm text-center text-destructive font-medium">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="text-sm text-center text-present font-medium">✅ Attendance saved to server!</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onExportCSV}
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Redo
        </button>
      </div>
      <button
        onClick={onSaveToServer}
        disabled={isSaving || saveSuccess}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isSaving ? "Saving…" : saveSuccess ? "Saved" : "Save to Server"}
      </button>
    </div>
  );
}
