import { useState, useCallback } from "react";
import { sampleStudents, AttendanceRecord, AttendanceStatus } from "@/data/students";

export function useAttendance() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

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
  }, []);

  // Example: how to persist attendance to a backend
  const submitAttendance = useCallback(async () => {
    const payload = {
      date: new Date().toISOString().split("T")[0],
      records: records.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        timestamp: r.timestamp.toISOString(),
      })),
    };
    console.log("📤 Submitting attendance:", JSON.stringify(payload, null, 2));
    // Example API call:
    // await fetch('/api/attendance', { method: 'POST', body: JSON.stringify(payload) });
    return payload;
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
    exportCSV,
  };
}
