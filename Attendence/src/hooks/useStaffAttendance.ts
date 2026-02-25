import { useState, useCallback } from "react";
import { format } from "date-fns";
import { sampleStaff, StaffAttendanceRecord, AttendanceStatus } from "@/data/staff";

export function useStaffAttendance() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentMember = currentIndex < sampleStaff.length ? sampleStaff[currentIndex] : null;
  const isComplete = currentIndex >= sampleStaff.length;
  const totalMembers = sampleStaff.length;
  const markedCount = records.length;

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;

  const markAttendance = useCallback(
    (status: AttendanceStatus) => {
      if (!currentMember) return;
      const record: StaffAttendanceRecord = {
        staffId: currentMember.id,
        status,
        timestamp: new Date(),
      };
      setRecords((prev) => [...prev, record]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentMember]
  );

  const undo = useCallback(() => {
    if (records.length === 0) return;
    setRecords((prev) => prev.slice(0, -1));
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, [records.length]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setRecords([]);
    setSaveError(null);
    setSaveSuccess(false);
  }, []);

  const submitAttendance = useCallback(async () => {
    const payload = {
      date: format(new Date(), "yyyy-MM-dd"),
      records: records.map((r) => ({
        staffId: r.staffId,
        status: r.status,
        timestamp: r.timestamp.toISOString(),
      })),
    };

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/staff-attendance", {
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
    const header = "Staff ID,Name,Role,Department,Status,Time\n";
    const rows = records
      .map((r) => {
        const member = sampleStaff.find((s) => s.id === r.staffId)!;
        return `${member.staffId},${member.name},${member.role},${member.department},${r.status},${r.timestamp.toLocaleTimeString()}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-attendance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  return {
    currentMember,
    currentIndex,
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
  };
}
