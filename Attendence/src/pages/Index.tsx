import { useState } from "react";
import { Undo2, BarChart2 } from "lucide-react";
import SwipeCard, { SwipeActions } from "@/components/SwipeCard";
import AttendanceSummary from "@/components/AttendanceSummary";
import { useAttendance } from "@/hooks/useAttendance";
import ViewAttendance from "@/pages/ViewAttendance";

const Index = () => {
  const [showView, setShowView] = useState(false);
  const {
    currentStudent,
    currentIndex,
    isComplete,
    totalStudents,
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
  } = useAttendance();

  if (showView) {
    return <ViewAttendance onBack={() => setShowView(false)} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="w-full max-w-sm space-y-1 text-center mb-8">
        <div className="flex items-center justify-between">
          <div className="w-8" />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            📋 Attendance
          </h1>
          <button
            onClick={() => setShowView(true)}
            title="View saved attendance"
            className="flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <BarChart2 className="h-5 w-5" />
          </button>
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
                {markedCount} of {totalStudents} students
              </span>
              <span>{Math.round((markedCount / totalStudents) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(markedCount / totalStudents) * 100}%` }}
              />
            </div>
          </div>

          {/* Swipe area */}
          <div className="relative flex h-[360px] w-full max-w-sm items-center justify-center">
            {currentStudent && (
              <SwipeCard
                key={currentStudent.id}
                student={currentStudent}
                onSwipe={markAttendance}
              />
            )}
          </div>

          {/* Action buttons */}
          <SwipeActions
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
        <AttendanceSummary
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

export default Index;
