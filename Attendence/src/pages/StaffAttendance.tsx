import { useState, useEffect } from "react";
import { Undo2, ArrowLeft } from "lucide-react";
import StaffSwipeCard, { StaffSwipeActions } from "@/components/StaffSwipeCard";
import StaffAttendanceSummary from "@/components/StaffAttendanceSummary";
import { useStaffAttendance } from "@/hooks/useStaffAttendance";

interface StaffAttendanceProps {
  onBack: () => void;
  onSaved: () => void;
}

const StaffAttendance = ({ onBack, onSaved }: StaffAttendanceProps) => {
  const {
    currentMember,
    isComplete,
    totalMembers,
    markedCount,
    presentCount,
    absentCount,
    records,
    markAttendance,
    undo,
    reset,
    submitAttendance,
    isSaving,
    saveError,
    saveSuccess,
    exportCSV,
  } = useStaffAttendance();

  useEffect(() => {
    if (saveSuccess) {
      onSaved();
    }
  }, [saveSuccess, onSaved]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="w-full max-w-sm space-y-1 text-center mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            👩‍🏫 Staff Attendance
          </h1>
          <div className="w-16" />
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {!isComplete ? (
        <>
          {/* Progress */}
          <div className="w-full max-w-sm mb-6 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>
                {markedCount} of {totalMembers} staff members
              </span>
              <span>{Math.round((markedCount / totalMembers) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(markedCount / totalMembers) * 100}%` }}
              />
            </div>
          </div>

          {/* Swipe area */}
          <div className="relative flex h-[420px] w-full max-w-sm items-center justify-center">
            {currentMember && (
              <StaffSwipeCard
                key={currentMember.id}
                member={currentMember}
                onSwipe={markAttendance}
              />
            )}
          </div>

          {/* Action buttons */}
          <StaffSwipeActions
            onPresent={() => markAttendance("present")}
            onAbsent={() => markAttendance("absent")}
          />

          {/* Undo */}
          {markedCount > 0 && (
            <button
              onClick={undo}
              className="mt-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Undo2 className="h-4 w-4" />
              Undo last
            </button>
          )}

          {/* Hint */}
          <p className="mt-6 text-xs text-muted-foreground/60 text-center">
            Swipe right for Present · Swipe left for Absent
          </p>
        </>
      ) : (
        <StaffAttendanceSummary
          records={records}
          presentCount={presentCount}
          absentCount={absentCount}
          onExportCSV={exportCSV}
          onReset={reset}
          onSaveToServer={submitAttendance}
          isSaving={isSaving}
          saveError={saveError}
          saveSuccess={saveSuccess}
        />
      )}
    </main>
  );
};

export default StaffAttendance;
