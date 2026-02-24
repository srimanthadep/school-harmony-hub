import { useState, useCallback } from "react";
import { format } from "date-fns";
import { sampleStudents, AttendanceRecord, AttendanceStatus } from "@/data/students";

export function useAttendance() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentStudent = currentIndex < sampleStudents.length ? sampleStudents[currentIndex] : null;
  const isComplete = currentIndex >= sampleStudents.length;
  const totalStudents = sampleStudents.length;
  const markedCount = records.length;

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  const markAttendance = useCallback(
    (status: AttendanceStatus) => {
      if (!currentStudent) return;
      const record: AttendanceRecord = {
        studentId: currentStudent.id,
        status,
        timestamp: new Date(),
      };
      setRecords((prev) => [...prev, record]);
      setHistory((prev) => [...prev, record]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentStudent]
  );

  const undo = useCallback(() => {
    if (records.length === 0) return;
    setRecords((prev) => prev.slice(0, -1));
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, [records.length]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setRecords([]);
    setHistory([]);
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  const submitAttendance = useCallback(async () => {
    const payload = {
      date: format(new Date(), "yyyy-MM-dd"),
      records: records.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        timestamp: r.timestamp.toISOString(),
      })),
    };

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save attendance");
      }

      setSaveSuccess(true);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save to server";
      setSaveError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [records]);

  const exportCSV = useCallback(() => {
    const header = "Roll Number,Name,Class,Status,Time\n";
    const rows = records
      .map((r) => {
        const student = sampleStudents.find((s) => s.id === r.studentId)!;
        return `${student.rollNumber},${student.name},${student.classSection},${r.status},${r.timestamp.toLocaleTimeString()}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  return {
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
  };
}

