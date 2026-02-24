import { useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export interface AttendanceDay {
  date: string;
  records: { studentId: string; status: "present" | "absent"; timestamp: string }[];
}

export type ViewMode = "daily" | "weekly" | "monthly" | "classwise";

export function useViewAttendance() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRange = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/attendance/range?start=${start}&end=${end}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch attendance");
      }
      setAttendanceDays(data.records as AttendanceDay[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch attendance";
      setFetchError(message);
      setAttendanceDays([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDay = useCallback(async (date: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/attendance/${date}`);
      if (response.status === 404) {
        setAttendanceDays([]);
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch attendance");
      }
      setAttendanceDays([data.attendance as AttendanceDay]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch attendance";
      setFetchError(message);
      setAttendanceDays([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const load = useCallback(() => {
    const date = new Date(selectedDate + "T00:00:00");
    if (viewMode === "daily") {
      fetchDay(selectedDate);
    } else if (viewMode === "weekly") {
      const start = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const end = format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      fetchRange(start, end);
    } else if (viewMode === "monthly") {
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");
      fetchRange(start, end);
    } else if (viewMode === "classwise") {
      const start = format(startOfMonth(date), "yyyy-MM-dd");
      const end = format(endOfMonth(date), "yyyy-MM-dd");
      fetchRange(start, end);
    }
  }, [viewMode, selectedDate, fetchDay, fetchRange]);

  return {
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    attendanceDays,
    isLoading,
    fetchError,
    load,
  };
}
