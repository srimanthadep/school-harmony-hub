import { useState, useCallback } from 'react';

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceStudent {
    _id: string;
    name: string;
    rollNo: string;
    class: string;
    gender: string;
}

export interface AttendanceRecord {
    studentId: string;
    status: AttendanceStatus;
    timestamp: Date;
}

export function useAttendance(students: AttendanceStudent[]) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);

    const currentStudent = currentIndex < students.length ? students[currentIndex] : null;
    const isComplete = currentIndex >= students.length && students.length > 0;
    const totalStudents = students.length;
    const markedCount = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;

    const markAttendance = useCallback(
        (status: AttendanceStatus) => {
            if (!currentStudent) return;
            const record: AttendanceRecord = {
                studentId: currentStudent._id,
                status,
                timestamp: new Date(),
            };
            setRecords((prev) => [...prev, record]);
            setCurrentIndex((prev) => prev + 1);
        },
        [currentStudent]
    );

    const undo = useCallback(() => {
        if (records.length === 0) return;
        setRecords((prev) => prev.slice(0, -1));
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    }, [records.length]);

    const reset = useCallback(() => {
        setCurrentIndex(0);
        setRecords([]);
    }, []);

    const exportCSV = useCallback(() => {
        const header = 'Roll No,Name,Class,Status,Time\n';
        const rows = records
            .map((r) => {
                const student = students.find((s) => s._id === r.studentId);
                if (!student) return '';
                return `${student.rollNo},${student.name},${student.class},${r.status},${r.timestamp.toLocaleTimeString()}`;
            })
            .filter(Boolean)
            .join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [records, students]);

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
        exportCSV,
    };
}
